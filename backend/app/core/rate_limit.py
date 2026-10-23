"""
Simple in-process sliding-window rate limiter for OTP requests.
In a multi-process deployment replace this with a Redis-backed solution.
"""
import time
from collections import defaultdict, deque
from threading import Lock

from app.core.config import settings


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        with self._lock:
            dq = self._requests[key]
            # Remove expired entries
            while dq and dq[0] < cutoff:
                dq.popleft()
            if len(dq) >= self.max_requests:
                return False
            dq.append(now)
            return True

    def reset(self, key: str) -> None:
        with self._lock:
            self._requests.pop(key, None)


otp_rate_limiter = SlidingWindowRateLimiter(
    max_requests=settings.OTP_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.OTP_RATE_LIMIT_WINDOW_SECONDS,
)
