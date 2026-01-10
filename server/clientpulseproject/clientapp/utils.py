from django.utils.dateparse import parse_datetime
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def format_datetime_safely(dt_value, fmt='%B %d, %Y at %I:%M %p'):
    """
    Safely formats a datetime object or string.
    Returns the formatted string or the original value as a string if parsing fails.
    """
    if dt_value is None:
        return "N/A"
        
    if isinstance(dt_value, datetime):
        return dt_value.strftime(fmt)
        
    if isinstance(dt_value, str):
        try:
            # Try to parse ISO format first
            dt = parse_datetime(dt_value)
            if dt:
                return dt.strftime(fmt)
            # Try to parse common format if ISO fails
            dt = datetime.fromisoformat(dt_value.replace('Z', '+00:00'))
            return dt.strftime(fmt)
        except Exception as e:
            logger.warning(f"Failed to parse datetime string '{dt_value}': {e}")
            return dt_value
            
    return str(dt_value)
