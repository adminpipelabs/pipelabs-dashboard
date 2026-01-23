"""
Security utilities - JWT tokens, password hashing, encryption, wallet signature verification
"""
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from eth_account.messages import encode_defunct
from web3 import Web3
import base58

from app.core.config import settings

# Initialize Web3 for EVM
w3 = Web3()


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


# JWT tokens
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# API Key encryption (Fernet)
def get_fernet() -> Fernet:
    """Get Fernet instance for encryption"""
    return Fernet(settings.ENCRYPTION_KEY.encode())


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key for storage"""
    f = get_fernet()
    return f.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt a stored API key"""
    f = get_fernet()
    return f.decrypt(encrypted_key.encode()).decode()


# Wallet signature verification
def detect_wallet_type(wallet_address: str) -> str:
    """
    Detect wallet type based on address format
    Returns: "EVM" or "Solana"
    """
    if wallet_address.startswith("0x") and len(wallet_address) == 42:
        return "EVM"
    elif len(wallet_address) >= 32 and len(wallet_address) <= 44:
        # Solana addresses are base58 encoded, typically 32-44 characters
        try:
            # Try to decode as base58 to validate Solana address
            base58.b58decode(wallet_address)
            return "Solana"
        except:
            return "EVM"  # Default to EVM if can't decode
    return "EVM"  # Default


def verify_wallet_signature(wallet_address: str, message: str, signature: str, wallet_type: Optional[str] = None) -> bool:
    """
    Verify wallet signature for both EVM and Solana wallets
    """
    if wallet_type is None:
        wallet_type = detect_wallet_type(wallet_address)
    
    if wallet_type == "Solana":
        return verify_solana_signature(wallet_address, message, signature)
    else:
        return verify_evm_signature(wallet_address, message, signature)


def verify_evm_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify Ethereum wallet signature"""
    try:
        # Normalize address
        wallet_address = Web3.to_checksum_address(wallet_address)
        
        # Create message hash
        message_hash = encode_defunct(text=message)
        
        # Recover address from signature
        recovered_address = w3.eth.account.recover_message(message_hash, signature=signature)
        
        # Compare addresses (case-insensitive)
        return recovered_address.lower() == wallet_address.lower()
    except Exception as e:
        print(f"EVM signature verification error: {e}")
        return False


def verify_solana_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify Solana wallet signature"""
    try:
        from solders.signature import Signature
        from solders.pubkey import Pubkey
        from solders.message import Message
        
        # Decode signature (base58)
        sig_bytes = base58.b58decode(signature)
        sig = Signature.from_bytes(sig_bytes)
        
        # Decode public key (base58)
        pubkey_bytes = base58.b58decode(wallet_address)
        pubkey = Pubkey.from_bytes(pubkey_bytes)
        
        # Create message from string
        message_bytes = message.encode('utf-8')
        msg = Message.from_bytes(message_bytes)
        
        # Verify signature
        return sig.verify(pubkey, msg)
    except Exception as e:
        print(f"Solana signature verification error: {e}")
        # Fallback: For now, if Solana verification fails, we'll allow it
        # In production, you should properly implement this with @solana/web3.js equivalent
        return False
