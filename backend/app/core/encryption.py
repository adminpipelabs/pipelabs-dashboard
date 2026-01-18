"""
Encryption utilities for sensitive data like API keys
"""
import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


class EncryptionManager:
    """Handles encryption/decryption of sensitive data"""
    
    def __init__(self):
        # Derive encryption key from SECRET_KEY
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'pipe_labs_salt_2024',  # In production, use settings.ENCRYPTION_SALT
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext string"""
        if not plaintext:
            return ""
        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, encrypted: str) -> str:
        """Decrypt encrypted string"""
        if not encrypted:
            return ""
        decoded = base64.urlsafe_b64decode(encrypted.encode())
        decrypted = self.cipher.decrypt(decoded)
        return decrypted.decode()


# Global instance
encryption_manager = EncryptionManager()


def encrypt_api_key(api_key: str) -> str:
    """Encrypt an API key"""
    return encryption_manager.encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key"""
    return encryption_manager.decrypt(encrypted_key)
