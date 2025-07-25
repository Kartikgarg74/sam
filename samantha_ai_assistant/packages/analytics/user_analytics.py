from collections import Counter


command_counter = Counter()
feature_counter = Counter()


def log_command(command: str):
    command_counter[command] += 1


def log_feature(feature: str):
    feature_counter[feature] += 1


def get_usage_stats():
    return {
        "most_used_command": command_counter.most_common(1),
        "command_counts": dict(command_counter),
        "feature_adoption": dict(feature_counter),
    }
