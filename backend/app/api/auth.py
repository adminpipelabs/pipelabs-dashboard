"""
Enhanced Authentication API with Wallet + Email + 2FA support
Supports: MetaMask wallet, Email/Password, Admin 2FA
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from app.core.security import verify_wallet_signature, detect_wallet_type
from web3 import Web3
import pyotp
import qrcode
import io
import base64

from app.core.database import get_db
from app.models.user import User, Admin
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ==================== Request/Response Models ====================

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "client"  # client or admin

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None  # Required for admins with 2FA enabled

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    wallet_address: Optional[str]
    role: str
    is_active: bool
    totp_enabled: bool

class Enable2FAResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code
    backup_codes: list[str]

# ==================== Helper Functions ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

# Wallet signature verification moved to app.core.security

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_current_client(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current authenticated client from JWT token (user must be a client)"""
    from app.models import Client
    
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required"
        )
    
    # Find the Client record by wallet_address or email
    if current_user.wallet_address:
        result = await db.execute(
            select(Client).where(Client.wallet_address == current_user.wallet_address)
        )
        client = result.scalar_one_or_none()
    elif current_user.email:
        result = await db.execute(
            select(Client).where(Client.email == current_user.email)
        )
        client = result.scalar_one_or_none()
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client record not found"
        )
    
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client record not found"
        )
    
    if client.status.value != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client account is not active"
        )
    
    return client

# ==================== Auth Routes ====================

@router.post("/wallet/login", response_model=TokenResponse)
async def wallet_login(
    request: WalletLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with Ethereum wallet (MetaMask, WalletConnect, etc.)
    Only allows pre-registered wallets (admin or client created by admin)
    No auto-registration - security requirement
    """
    # Verify signature
    if not verify_wallet_signature(request.wallet_address, request.message, request.signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Normalize wallet address
    wallet_address = Web3.to_checksum_address(request.wallet_address)
    
    # Check if User exists (admin or existing client user)
    user_result = await db.execute(
        select(User).where(User.wallet_address == wallet_address)
    )
    user = user_result.scalar_one_or_none()
    
    # If User exists, check if admin or client
    if user:
        if user.role == "admin":
            # Admin login - update last login
            user.last_login = datetime.utcnow()
            await db.commit()
        else:
            # Existing client user - update last login
            user.last_login = datetime.utcnow()
            await db.commit()
    else:
        # No User exists - check if Client exists (created by admin)
        from app.models import Client
        client_result = await db.execute(
            select(Client).where(Client.wallet_address == wallet_address)
        )
        client = client_result.scalar_one_or_none()
        
        if client:
            # Client exists - create User record linked to Client
            user = User(
                wallet_address=wallet_address,
                email=client.email,
                role="client",
                is_active=True,
                client_id=client.id,
                last_login=datetime.utcnow()
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Wallet not registered - reject login
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Wallet address {wallet_address} is not registered. Please contact your admin to create your account. Only wallets registered by an admin can log in."
            )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
            "wallet": wallet_address
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "wallet_address": user.wallet_address,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "totp_enabled": user.totp_secret is not None
        }
    )

@router.post("/email/register", response_model=TokenResponse)
async def email_register(
    request: EmailRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register with email and password
    Available for both clients and admins
    """
    # Validate role
    if request.role not in ["client", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'client' or 'admin'"
        )
    
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(request.password)
    user = User(
        email=request.email,
        password_hash=hashed_password,
        role=request.role,
        is_active=True,
        last_login=datetime.utcnow()
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
            "email": request.email
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "totp_enabled": False
        }
    )

@router.post("/email/login", response_model=TokenResponse)
async def email_login(
    request: EmailLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    Admins with 2FA enabled must provide TOTP code
    """
    # Get user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # If admin with 2FA enabled, require TOTP code
    if user.role == "admin" and user.totp_secret:
        if not request.totp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code required for admin login"
            )
        
        # Verify TOTP code
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(request.totp_code, valid_window=1):  # Allow 30s window
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code"
            )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
            "email": user.email
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "wallet_address": user.wallet_address,
            "role": user.role,
            "is_active": user.is_active,
            "totp_enabled": user.totp_secret is not None
        }
    )

@router.post("/2fa/enable", response_model=Enable2FAResponse)
async def enable_2fa(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Enable 2FA for admin users
    Returns QR code and secret for Google Authenticator/Authy
    """
    # Generate TOTP secret
    secret = pyotp.random_base32()
    
    # Create TOTP URI for QR code
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email or f"Admin-{current_user.id}",
        issuer_name="Pipe Labs Dashboard"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    # Generate backup codes (10 codes)
    backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]
    
    # Save to database
    current_user.totp_secret = secret
    await db.commit()
    
    return Enable2FAResponse(
        secret=secret,
        qr_code=f"data:image/png;base64,{qr_code_base64}",
        backup_codes=backup_codes
    )

@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Disable 2FA for current admin user"""
    current_user.totp_secret = None
    await db.commit()
    
    return {"message": "2FA disabled successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        wallet_address=current_user.wallet_address,
        role=current_user.role,
        is_active=current_user.is_active,
        totp_enabled=current_user.totp_secret is not None
    )

@router.post("/logout")
async def logout():
    """
    Logout (client-side should remove token)
    Could implement token blacklist here for added security
    """
    return {"message": "Logged out successfully"}

@router.get("/nonce/{wallet_address}")
async def get_nonce(wallet_address: str):
    """
    Get nonce message for wallet signature
    Used by frontend before signing
    """
    timestamp = int(datetime.utcnow().timestamp())
    nonce = f"Sign this message to login to Pipe Labs Dashboard.\n\nWallet: {wallet_address}\nTimestamp: {timestamp}"
    
    return {
        "message": nonce,
        "timestamp": timestamp
    }
