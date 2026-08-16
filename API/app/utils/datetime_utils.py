from datetime import datetime, timezone

def get_datetime() -> datetime:
    """
    Returns current datetime object.
    Centralized datetime function to easily change timezone or format globally if needed.
    """
    return datetime.now(timezone.utc)

def get_datetime_iso_string() -> str:
    """
    Returns current datetime formatted as ISO 8601 string.
    """
    return get_datetime().isoformat()

def get_datetime_timestamp() -> int:
    """
    Returns current datetime Unix timestamp as an integer.
    """
    return int(get_datetime().timestamp())
