"""Shared helpers for API route input handling."""
import re


HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


def normalize_icon(value):
    """Store blank icon inputs as null while preserving explicit emoji values."""
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def normalize_color(value):
    """Store blank color inputs as null while accepting only hex color values."""
    if not isinstance(value, str):
        return None

    trimmed = value.strip()
    if not trimmed:
        return None

    return trimmed.lower() if HEX_COLOR_PATTERN.match(trimmed) else None
