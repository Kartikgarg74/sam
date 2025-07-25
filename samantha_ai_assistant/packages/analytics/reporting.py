import datetime


def generate_report(data):
    print(f"[REPORT] {datetime.datetime.now()}: {data}")


def schedule_report(data, interval_minutes=60):
    print(f"[SCHEDULED REPORT] Every {interval_minutes} min: {data}")
