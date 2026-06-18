"""Shared helpers for API route input handling."""


def normalize_icon(value):
    """Store blank icon inputs as null while preserving explicit emoji values."""
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None
