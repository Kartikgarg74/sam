import json
import os
from datetime import datetime
from collections import defaultdict

class MemorySystem:
    def __init__(self, memory_file='memory.json'):
        self.memory_file = memory_file
        self.memory = self._load_memory()

    def _load_memory(self):
        if os.path.exists(self.memory_file):
            with open(self.memory_file, 'r') as f:
                return json.load(f)
        return {
            "most_used_apps": defaultdict(int),
            "frequent_commands_per_time": defaultdict(lambda: defaultdict(int)),
            "user_phrasing_patterns": defaultdict(int)
        }

    def _save_memory(self):
        with open(self.memory_file, 'w') as f:
            json.dump(self.memory, f, indent=4)

    def add_app_usage(self, app_name):
        self.memory["most_used_apps"][app_name] += 1
        self._save_memory()

    def add_command_usage(self, command, time_of_day=None):
        if time_of_day is None:
            time_of_day = self._get_time_of_day()
        self.memory["frequent_commands_per_time"][time_of_day][command] += 1
        self._save_memory()

    def add_phrasing_pattern(self, pattern):
        self.memory["user_phrasing_patterns"][pattern] += 1
        self._save_memory()

    def get_most_used_app(self):
        if not self.memory["most_used_apps"]:
            return None
        return max(self.memory["most_used_apps"], key=self.memory["most_used_apps"].get)

    def get_frequent_command_for_time(self, time_of_day=None):
        if time_of_day is None:
            time_of_day = self._get_time_of_day()
        if not self.memory["frequent_commands_per_time"][time_of_day]:
            return None
        return max(self.memory["frequent_commands_per_time"][time_of_day], 
                   key=self.memory["frequent_commands_per_time"][time_of_day].get)

    def get_top_phrasing_patterns(self, top_n=3):
        if not self.memory["user_phrasing_patterns"]:
            return []
        sorted_patterns = sorted(self.memory["user_phrasing_patterns"].items(), key=lambda item: item[1], reverse=True)
        return [pattern for pattern, count in sorted_patterns[:top_n]]

    def _get_time_of_day(self):
        hour = datetime.now().hour
        if 5 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"

    def get_suggestion(self):
        suggestion = []
        most_used_app = self.get_most_used_app()
        if most_used_app:
            suggestion.append(f"You often use {most_used_app}.")

        frequent_command = self.get_frequent_command_for_time()
        if frequent_command:
            suggestion.append(f"At this time of day, you usually {frequent_command}.")

        return " ".join(suggestion) if suggestion else "No specific suggestions at this moment."