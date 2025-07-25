from collections import Counter
from typing import Dict


user_counter = Counter()
revenue_total = 0.0
feature_adoption = Counter()


def log_user(user_id: str):
    user_counter[user_id] += 1


def log_revenue(amount: float):
    global revenue_total
    revenue_total += amount


def log_feature(feature: str):
    feature_adoption[feature] += 1


def get_bi_metrics() -> Dict:
    return {
        "total_users": sum(user_counter.values()),
        "unique_users": len(user_counter),
        "revenue": revenue_total,
        "feature_adoption": dict(feature_adoption),
    }
