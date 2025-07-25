from collections import deque, Counter
from typing import List


class UsagePredictor:
    def __init__(self, window_size=10):
        self.history = deque(maxlen=window_size)
        self.counter = Counter()

    def log_command(self, command: str):
        self.history.append(command)
        self.counter[command] += 1

    def predict_next_commands(self, top_n=3) -> List[str]:
        # Predict next likely commands based on frequency
        return [cmd for cmd, _ in self.counter.most_common(top_n)]

    def get_trend(self) -> str:
        # Simple trend: is usage increasing or decreasing?
        if len(self.history) < 2:
            return "stable"
        first = self.history[0]
        last = self.history[-1]
        return (
            "increasing" if self.counter[last] > self.counter[first] else "decreasing"
        )


predictor = UsagePredictor()
