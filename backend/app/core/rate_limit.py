"""
Rate limiting for API endpoints - Enterprise grade
Prevents abuse and ensures fair resource usage
"""
from fastapi import Request, HTTPException, status
from functools import wraps
import time
from collections import defaultdict
from typing import Callable
import asyncio

# In-memory rate limiter (for single instance)
# For multi-instance deployments, use Redis-based rate limiting
_rate_limit_store = defaultdict(list)
_rate_limit_lock = asyncio.Lock()


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def check_rate_limit(self, key: str) -> bool:
        """Check if request should be allowed"""
        async with _rate_limit_lock:
            now = time.time()
            # Clean old entries
            _rate_limit_store[key] = [
                timestamp for timestamp in _rate_limit_store[key]
                if now - timestamp < self.window_seconds
            ]
            
            # Check limit
            if len(_rate_limit_store[key]) >= self.max_requests:
                return False
            
            # Add current request
            _rate_limit_store[key].append(now)
            return True


# Rate limiters for different endpoints
admin_client_creation = RateLimiter(max_requests=20, window_seconds=60)  # 20 per minute
admin_general = RateLimiter(max_requests=100, window_seconds=60)  # 100 per minute


def rate_limit(limiter: RateLimiter):
    """Decorator for rate limiting"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get identifier (admin ID or IP)
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # Try to get from kwargs
                request = kwargs.get('request')
            
            if request:
                # Use admin ID if available, otherwise IP
                identifier = getattr(request.state, 'admin_id', None) or request.client.host
            else:
                identifier = "unknown"
            
            allowed = await limiter.check_rate_limit(f"{func.__name__}:{identifier}")
            
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {limiter.max_requests} requests per {limiter.window_seconds} seconds."
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
