from datetime import datetime, timedelta


def parse_date(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%Y-%m-%d")


def date_range(start_date: str, end_date: str) -> list[str]:
    """Return list of date strings from start to end inclusive."""
    start = parse_date(start_date)
    end = parse_date(end_date)
    days = []
    current = start
    while current <= end:
        days.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    return days


def count_days(start_date: str, end_date: str) -> int:
    start = parse_date(start_date)
    end = parse_date(end_date)
    return (end - start).days + 1
