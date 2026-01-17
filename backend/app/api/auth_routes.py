"""
Authentication routes for wallet and email-based login
Supports both client (wallet + email) and admin (email + 2FA) authentication
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from eth_account.messages import encode_defunct
from web3 import Web3
import pyotp
import qrcode
import io
import base64

from app.core.database import get_db
from app.models import User, Admin
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings (should be in config)
SECRET_KEY = "your-secret-key-change-in-production"  # TODO: Move to env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

w3 = Web3()

# ==================== Models ====================

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

class EmailRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "client"  # client or admin
    company_name: Optional[str] = None

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None  # For admin 2FA

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class Enable2FAResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code
    backup_codes: list[str]

# ==================== Helper Functions ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
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

def verify_wallet_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify Ethereum wallet signature"""
    try:
        # Normalize address
        wallet_address = Web3.to_checksum_address(wallet_address)
        
        # Create message hash
        message_hash = encode_defunct(text=message)
        
        # Recover address from signature
        recovered_address = w3.eth.account.recover_message(message_hash, signature=signature)
        
        # Compare addresses
        return recovered_address.lower() == wallet_address.lower()
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Get current user from JWT token"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ==================== Routes ====================

@router.post("/wallet/login", response_model=TokenResponse)
async def wallet_login(
    request: WalletLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with Ethereum wallet (MetaMask, WalletConnect, etc.)
    Client signs a message to prove ownership of wallet
    """
    # Verify signature
    if not verify_wallet_signature(request.wallet_address, request.message, request.signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Normalize wallet address
    wallet_address = Web3.to_checksum_address(request.wallet_address)
    
    # Check if user exists
    result = await db.execute(
        select(User).where(User.wallet_address == wallet_address)
    )
    user = result.scalar_one_or_none()
    
    # Create user if doesn't exist (auto-registration)
    if not user:
        user = User(
            wallet_address=wallet_address,
            role="client",
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "wallet": wallet_address}
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "wallet_address": user.wallet_address,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
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
        is_active=True
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": request.email}
    )
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    )

@router.post("/email/login", response_model=TokenResponse)
async def email_login(
    request: EmailLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    Admins require 2FA (TOTP code)
    """
    # Get user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
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
    
    # If admin, require 2FA
    if user.role == "admin":
        if not user.totp_secret:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="2FA not set up. Please contact administrator."
            )
        
        if not request.totp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code required for admin login"
            )
        
        # Verify TOTP code
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(request.totp_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code"
            )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": user.email}
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Enable 2FA for admin users
    Returns QR code and secret for Google Authenticator/Authy
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="2FA is only available for admin users"
        )
    
    # Generate TOTP secret
    secret = pyotp.random_base32()
    
    # Create TOTP URI for QR code
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
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
    # TODO: Store backup codes (hashed) in database
    await db.commit()
    
    return Enable2FAResponse(
        secret=secret,
        qr_code=f"data:image/png;base64,{qr_code_base64}",
        backup_codes=backup_codes
    )

@router.post("/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable 2FA for current user"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="2FA is only available for admin users"
        )
    
    current_user.totp_secret = None
    await db.commit()
    
    return {"message": "2FA disabled successfully"}

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "wallet_address": current_user.wallet_address,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "totp_enabled": current_user.totp_secret is not None,
        "last_login": current_user.last_login
    }

@router.post("/logout")
async def logout():
    """
    Logout (client-side should remove token)
    Could implement token blacklist here for added security
    """
    return {"message": "Logged out successfully"}
