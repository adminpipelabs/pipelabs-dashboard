#!/usr/bin/env python3
"""
Direct client creation script - bypasses frontend issues
Usage: python add_client_direct.py "Client Name" "0xWalletAddress" "email@example.com"

Run from backend directory:
    cd backend
    python add_client_direct.py "Client Name" "0xWalletAddress"
"""
import sys
import os
import asyncio

# Ensure we're running from backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
sys.path.insert(0, script_dir)

from web3 import Web3
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Import app modules
try:
    from app.models import Client, ClientStatus
    from app.core.config import settings
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the backend directory:")
    print("  cd backend")
    print("  python add_client_direct.py ...")
    sys.exit(1)

# Get DATABASE_URL from environment or settings (will be set in main() if not found)
db_url = os.getenv("DATABASE_URL") or getattr(settings, 'DATABASE_URL', None)

# Fix Railway DATABASE_URL format (postgresql:// -> postgresql+asyncpg://)
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Initialize engine only if we have a URL, otherwise will be set in main()
if db_url:
    engine = create_async_engine(db_url, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
else:
    engine = None
    async_session_maker = None

async def create_client(name: str, wallet_address: str, email: str = None):
    """Create a client directly in the database - Production Ready"""
    import traceback
    from datetime import datetime
    
    try:
        # Validate inputs
        if not name or not name.strip():
            print("❌ Error: Client name is required")
            return False
        
        if not wallet_address or not wallet_address.strip():
            print("❌ Error: Wallet address is required")
            return False
        
        # Normalize wallet address
        try:
            wallet = Web3.to_checksum_address(wallet_address.strip())
        except Exception as e:
            print(f"❌ Error: Invalid wallet address format: {e}")
            return False
        
        # Validate email format if provided
        if email and email.strip():
            email = email.strip()
            if '@' not in email or '.' not in email:
                print(f"⚠️  Warning: Email format looks invalid: {email}")
                print("   Continuing anyway...")
        
        async with async_session_maker() as db:
            # Check if wallet already exists
            result = await db.execute(
                select(Client).where(Client.wallet_address == wallet)
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"❌ Wallet {wallet} already registered for client: {existing.name}")
                print(f"   Existing client ID: {existing.id}")
                return False
            
            # Check email if provided
            if email:
                email_result = await db.execute(
                    select(Client).where(Client.email == email)
                )
                existing_email = email_result.scalar_one_or_none()
                if existing_email:
                    print(f"❌ Email {email} already registered for client: {existing_email.name}")
                    return False
            
            # Create new client
            client = Client(
                name=name.strip(),
                wallet_address=wallet,
                email=email if email else None,
                password_hash=None,
                role="client",
                status=ClientStatus.ACTIVE,
                tier="Standard",
                settings={},
            )
            
            db.add(client)
            await db.commit()
            await db.refresh(client)
            
            # Log success
            timestamp = datetime.utcnow().isoformat()
            print(f"\n✅ CLIENT CREATED SUCCESSFULLY!")
            print(f"{'='*60}")
            print(f"   ID:          {client.id}")
            print(f"   Name:        {client.name}")
            print(f"   Wallet:      {client.wallet_address}")
            print(f"   Email:       {client.email or 'None'}")
            print(f"   Status:      {client.status.value}")
            print(f"   Created:     {timestamp}")
            print(f"{'='*60}\n")
            
            # Write to log file for audit trail
            try:
                log_file = os.path.join(os.path.dirname(__file__), 'client_creation.log')
                with open(log_file, 'a') as f:
                    f.write(f"{timestamp} | CREATED | ID:{client.id} | Name:{client.name} | Wallet:{wallet} | Email:{email or 'None'}\n")
            except Exception as log_error:
                print(f"⚠️  Warning: Could not write to log file: {log_error}")
            
            return True
            
    except Exception as e:
        error_msg = f"❌ Error creating client: {e}"
        print(error_msg)
        print(f"\nFull error details:")
        traceback.print_exc()
        
        # Log error
        try:
            timestamp = datetime.utcnow().isoformat()
            log_file = os.path.join(os.path.dirname(__file__), 'client_creation.log')
            with open(log_file, 'a') as f:
                f.write(f"{timestamp} | ERROR | Name:{name} | Wallet:{wallet_address} | Error:{str(e)}\n")
        except:
            pass
        
        return False
    finally:
        await engine.dispose()

async def main():
    # Check if DATABASE_URL is set
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("⚠️  DATABASE_URL not found in environment.")
        print("\nPlease paste your DATABASE_URL from Railway:")
        print("(Railway → Backend → Variables → DATABASE_URL → Copy)")
        print()
        db_url = input("DATABASE_URL: ").strip()
        if not db_url:
            print("❌ DATABASE_URL is required. Exiting.")
            sys.exit(1)
        # Update the global db_url variable
        global engine, async_session_maker
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        engine = create_async_engine(db_url, echo=False)
        async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    if len(sys.argv) < 3:
        print("Usage: python add_client_direct.py \"Client Name\" \"0xWalletAddress\" [email]")
        print("\nExample:")
        print('  python add_client_direct.py "John Doe" "0x61b6EF3769c88332629fA657508724a912b79101" "john@example.com"')
        sys.exit(1)
    
    name = sys.argv[1]
    wallet = sys.argv[2]
    email = sys.argv[3] if len(sys.argv) > 3 else None
    
    print(f"\nCreating client: {name}")
    print(f"Wallet: {wallet}")
    if email:
        print(f"Email: {email}")
    print()
    
    success = await create_client(name, wallet, email)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
