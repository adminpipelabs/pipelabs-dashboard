"""
Billing and Payment API
Handles client registration with payment, invoicing, and billing automation
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models import (
    Client, Invoice, User,
    ClientStatus, PaymentStatus, BillingPlan, InvoiceStatus, PaymentMethod, UserRole
)

router = APIRouter(prefix="/billing", tags=["billing"])


# ==================== Pydantic Models ====================

class ClientRegistrationRequest(BaseModel):
    """Client registration with contract acceptance"""
    company_name: str = Field(..., min_length=2, max_length=100)
    contact_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    wallet_address: Optional[str] = None
    
    # Contract acceptance
    contract_accepted: bool
    contract_signature: str = Field(..., min_length=2)
    
    # Billing
    billing_plan: BillingPlan = BillingPlan.MONTHLY


class PaymentProofRequest(BaseModel):
    """Payment proof submission"""
    client_id: str
    payment_method: PaymentMethod
    transaction_hash: Optional[str] = None  # For crypto
    stripe_payment_intent_id: Optional[str] = None  # For Stripe
    amount: Decimal


class InvoiceResponse(BaseModel):
    """Invoice details"""
    id: str
    client_id: str
    amount: float
    billing_period: str
    status: str
    payment_method: Optional[str]
    due_date: str
    paid_date: Optional[str]
    created_at: str


class ClientBillingInfo(BaseModel):
    """Client billing information"""
    client_id: str
    company_name: str
    email: str
    status: str
    billing_plan: str
    monthly_fee: float
    payment_status: str
    next_billing_date: Optional[str]
    last_payment_date: Optional[str]
    grace_period_days: int
    pending_invoices: list[InvoiceResponse]


# ==================== Helper Functions ====================

def get_plan_price(plan: BillingPlan) -> Decimal:
    """Get monthly price for billing plan"""
    prices = {
        BillingPlan.MONTHLY: Decimal("5000.00"),
        BillingPlan.QUARTERLY: Decimal("14000.00"),  # ~7% discount
        BillingPlan.ANNUAL: Decimal("50000.00"),  # ~17% discount
    }
    return prices.get(plan, Decimal("5000.00"))


def calculate_next_billing_date(plan: BillingPlan, start_date: datetime) -> datetime:
    """Calculate next billing date based on plan"""
    if plan == BillingPlan.MONTHLY:
        return start_date + timedelta(days=30)
    elif plan == BillingPlan.QUARTERLY:
        return start_date + timedelta(days=90)
    elif plan == BillingPlan.ANNUAL:
        return start_date + timedelta(days=365)
    return start_date + timedelta(days=30)


# ==================== API Endpoints ====================

@router.post("/register", response_model=dict)
async def register_client_with_payment(
    registration: ClientRegistrationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 1: Register new client with contract acceptance
    Status will be PENDING_PAYMENT until payment confirmed
    """
    
    # Validate contract acceptance
    if not registration.contract_accepted:
        raise HTTPException(status_code=400, detail="Contract must be accepted to proceed")
    
    # Check if email already exists
    result = await db.execute(
        select(Client).where(Client.email == registration.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create client (pending payment)
    client = Client(
        id=uuid.uuid4(),
        name=registration.company_name,
        email=registration.email,
        password_hash=get_password_hash(registration.password),
        role=UserRole.CLIENT,
        status=ClientStatus.PENDING_PAYMENT,
        
        # Billing
        billing_plan=registration.billing_plan,
        monthly_fee=float(get_plan_price(registration.billing_plan)),
        payment_status=PaymentStatus.PENDING,
        grace_period_days=7,
        auto_suspend_on_overdue=True,
        
        # Contract
        contract_accepted=True,
        contract_signed_date=datetime.utcnow(),
        contract_signature=registration.contract_signature,
        contract_ip_address=request.client.host,
    )
    
    db.add(client)
    
    # Create User entry for authentication
    user = User(
        id=uuid.uuid4(),
        email=registration.email,
        password_hash=get_password_hash(registration.password),
        wallet_address=registration.wallet_address,
        role=UserRole.CLIENT,
        is_active=False,  # Will activate after payment
    )
    db.add(user)
    
    # Create initial invoice
    invoice = Invoice(
        id=uuid.uuid4(),
        client_id=client.id,
        amount=float(get_plan_price(registration.billing_plan)),
        billing_period=datetime.utcnow().strftime("%Y-%m"),
        status=InvoiceStatus.PENDING,
        due_date=datetime.utcnow() + timedelta(days=7),  # 7 days to pay
    )
    db.add(invoice)
    
    await db.commit()
    await db.refresh(client)
    await db.refresh(invoice)
    
    return {
        "status": "pending_payment",
        "client_id": str(client.id),
        "invoice_id": str(invoice.id),
        "amount_due": float(invoice.amount),
        "due_date": invoice.due_date.isoformat(),
        "message": "Registration successful. Please complete payment to activate your account.",
        
        # Payment instructions
        "payment_options": {
            "crypto": {
                "usdt_address": "0xYOUR_WALLET_ADDRESS_HERE",  # TODO: Configure this
                "reference": f"CLIENT-{str(client.id)[:8]}",
            },
            "stripe": {
                "checkout_url": f"/billing/stripe-checkout/{invoice.id}"  # TODO: Implement
            }
        }
    }


@router.post("/confirm-payment")
async def confirm_payment(
    payment: PaymentProofRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 2: Confirm payment received (manual or automatic)
    This activates the client account
    """
    
    # Get client
    result = await db.execute(
        select(Client).where(Client.id == uuid.UUID(payment.client_id))
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get pending invoice
    invoice_result = await db.execute(
        select(Invoice)
        .where(Invoice.client_id == client.id)
        .where(Invoice.status == InvoiceStatus.PENDING)
        .order_by(Invoice.created_at.desc())
    )
    invoice = invoice_result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="No pending invoice found")
    
    # Verify amount matches
    if Decimal(str(invoice.amount)) != payment.amount:
        raise HTTPException(status_code=400, detail="Payment amount does not match invoice")
    
    # Update invoice
    invoice.status = InvoiceStatus.PAID
    invoice.payment_method = payment.payment_method
    invoice.payment_proof = payment.transaction_hash or payment.stripe_payment_intent_id
    invoice.paid_date = datetime.utcnow()
    
    # Activate client
    client.status = ClientStatus.ACTIVE
    client.payment_status = PaymentStatus.PAID
    client.last_payment_date = datetime.utcnow()
    client.billing_cycle_start = datetime.utcnow()
    client.next_billing_date = calculate_next_billing_date(client.billing_plan, datetime.utcnow())
    
    # Activate user for login
    user_result = await db.execute(
        select(User).where(User.email == client.email)
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.is_active = True
    
    await db.commit()
    
    # TODO: Send welcome email
    
    return {
        "status": "activated",
        "message": "Payment confirmed! Your account is now active.",
        "client_id": str(client.id),
        "next_billing_date": client.next_billing_date.isoformat() if client.next_billing_date else None,
        "dashboard_url": "https://adminpipelabs.github.io/pipelabs-dashboard/"
    }


@router.get("/client/{client_id}/billing-info", response_model=ClientBillingInfo)
async def get_client_billing_info(
    client_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get billing information for a client"""
    
    result = await db.execute(
        select(Client).where(Client.id == uuid.UUID(client_id))
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get pending invoices
    invoices_result = await db.execute(
        select(Invoice)
        .where(Invoice.client_id == client.id)
        .where(Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.OVERDUE]))
        .order_by(Invoice.created_at.desc())
    )
    invoices = invoices_result.scalars().all()
    
    return ClientBillingInfo(
        client_id=str(client.id),
        company_name=client.name,
        email=client.email,
        status=client.status.value,
        billing_plan=client.billing_plan.value,
        monthly_fee=float(client.monthly_fee),
        payment_status=client.payment_status.value,
        next_billing_date=client.next_billing_date.isoformat() if client.next_billing_date else None,
        last_payment_date=client.last_payment_date.isoformat() if client.last_payment_date else None,
        grace_period_days=client.grace_period_days,
        pending_invoices=[
            InvoiceResponse(
                id=str(inv.id),
                client_id=str(inv.client_id),
                amount=float(inv.amount),
                billing_period=inv.billing_period,
                status=inv.status.value,
                payment_method=inv.payment_method.value if inv.payment_method else None,
                due_date=inv.due_date.isoformat(),
                paid_date=inv.paid_date.isoformat() if inv.paid_date else None,
                created_at=inv.created_at.isoformat()
            )
            for inv in invoices
        ]
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get invoice details"""
    
    result = await db.execute(
        select(Invoice).where(Invoice.id == uuid.UUID(invoice_id))
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return InvoiceResponse(
        id=str(invoice.id),
        client_id=str(invoice.client_id),
        amount=float(invoice.amount),
        billing_period=invoice.billing_period,
        status=invoice.status.value,
        payment_method=invoice.payment_method.value if invoice.payment_method else None,
        due_date=invoice.due_date.isoformat(),
        paid_date=invoice.paid_date.isoformat() if invoice.paid_date else None,
        created_at=invoice.created_at.isoformat()
    )


# ==================== Admin Endpoints ====================

@router.post("/admin/generate-invoices")
async def generate_monthly_invoices(
    db: AsyncSession = Depends(get_db)
):
    """
    Admin/Cron: Generate invoices for clients due for billing
    Run this daily via cron job
    """
    
    # Find clients due for billing
    result = await db.execute(
        select(Client)
        .where(Client.status == ClientStatus.ACTIVE)
        .where(Client.next_billing_date <= datetime.utcnow())
    )
    clients = result.scalars().all()
    
    invoices_created = 0
    
    for client in clients:
        # Create invoice
        invoice = Invoice(
            id=uuid.uuid4(),
            client_id=client.id,
            amount=float(client.monthly_fee),
            billing_period=datetime.utcnow().strftime("%Y-%m"),
            status=InvoiceStatus.PENDING,
            due_date=datetime.utcnow() + timedelta(days=7),
        )
        db.add(invoice)
        
        # Update client payment status
        client.payment_status = PaymentStatus.PENDING
        
        # TODO: Send invoice email
        
        invoices_created += 1
    
    await db.commit()
    
    return {
        "invoices_created": invoices_created,
        "message": f"Generated {invoices_created} invoices"
    }


@router.post("/admin/suspend-overdue")
async def suspend_overdue_accounts(
    db: AsyncSession = Depends(get_db)
):
    """
    Admin/Cron: Suspend accounts with overdue payments
    Run this daily via cron job
    """
    
    # Find clients with overdue invoices past grace period
    result = await db.execute(
        select(Client)
        .where(Client.status == ClientStatus.ACTIVE)
        .where(Client.payment_status == PaymentStatus.OVERDUE)
        .where(Client.auto_suspend_on_overdue == True)
    )
    clients = result.scalars().all()
    
    suspended_count = 0
    
    for client in clients:
        # Check if grace period expired
        if client.next_billing_date:
            grace_period_end = client.next_billing_date + timedelta(days=client.grace_period_days)
            if datetime.utcnow() > grace_period_end:
                # Suspend client
                client.status = ClientStatus.SUSPENDED
                client.suspension_reason = "non_payment"
                
                # Deactivate user login
                user_result = await db.execute(
                    select(User).where(User.email == client.email)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    user.is_active = False
                
                # TODO: Send suspension email
                
                suspended_count += 1
    
    await db.commit()
    
    return {
        "suspended_count": suspended_count,
        "message": f"Suspended {suspended_count} accounts for non-payment"
    }


@router.post("/admin/mark-invoice-paid/{invoice_id}")
async def manually_mark_invoice_paid(
    invoice_id: str,
    payment_method: PaymentMethod,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Admin: Manually mark an invoice as paid"""
    
    result = await db.execute(
        select(Invoice).where(Invoice.id == uuid.UUID(invoice_id))
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update invoice
    invoice.status = InvoiceStatus.PAID
    invoice.payment_method = payment_method
    invoice.paid_date = datetime.utcnow()
    if notes:
        invoice.notes = notes
    
    # Update client
    client_result = await db.execute(
        select(Client).where(Client.id == invoice.client_id)
    )
    client = client_result.scalar_one_or_none()
    if client:
        client.payment_status = PaymentStatus.PAID
        client.last_payment_date = datetime.utcnow()
        client.next_billing_date = calculate_next_billing_date(client.billing_plan, datetime.utcnow())
        
        # Reactivate if suspended
        if client.status == ClientStatus.SUSPENDED and client.suspension_reason == "non_payment":
            client.status = ClientStatus.ACTIVE
            client.suspension_reason = None
    
    await db.commit()
    
    return {"status": "success", "message": "Invoice marked as paid"}
