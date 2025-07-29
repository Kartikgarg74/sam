import json
import os
from typing import Any, Dict, Optional

class MemoryEngine:
    """
    A minimal memory engine for Samantha AI Assistant using a local JSON store.
    """

    def __init__(self, storage_path: str = 'memory.json'):
        self.storage_path = storage_path
        self._data: Dict[str, Any] = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        """Loads data from the JSON storage file."""
        if os.path.exists(self.storage_path):
            with open(self.storage_path, 'r') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    # Handle empty or corrupted JSON file
                    return {}
        return {}

    def _save_data(self) -> None:
        """Saves the current data to the JSON storage file."""
        with open(self.storage_path, 'w') as f:
            json.dump(self._data, f, indent=4)

    def save_preference(self, key: str, value: Any) -> None:
        """Saves a user preference."""
        self._data[f'preference_{key}'] = value
        self._save_data()
        print(f"Preference '{key}' saved.")

    def recall_preference(self, key: str) -> Optional[Any]:
        """Recalls a user preference."""
        preference = self._data.get(f'preference_{key}')
        if preference is not None:
            print(f"Preference '{key}': {preference}")
        else:
            print(f"Preference '{key}' not found.")
        return preference

    def forget_preference(self, key: str) -> bool:
        """Deletes a user preference."""
        if f'preference_{key}' in self._data:
            del self._data[f'preference_{key}']
            self._save_data()
            print(f"Preference '{key}' forgotten.")
            return True
        print(f"Preference '{key}' not found, nothing to forget.")
        return False

    def save_last_action(self, action_name: str, details: Dict[str, Any]) -> None:
        """Saves the last performed action."""
        self._data['last_actions'] = self._data.get('last_actions', [])
        self._data['last_actions'].append({'action': action_name, 'details': details})
        # Keep only the last N actions to prevent the file from growing too large
        self._data['last_actions'] = self._data['last_actions'][-10:] 
        self._save_data()
        print(f"Last action '{action_name}' saved.")

    def recall_last_actions(self, count: int = 1) -> list[Dict[str, Any]]:
        """Recalls the last N performed actions."""
        actions = self._data.get('last_actions', [])
        recalled_actions = actions[-count:]
        if recalled_actions:
            print(f"Recalling last {len(recalled_actions)} action(s):")
            for action in recalled_actions:
                print(f"  - {action['action']}: {action['details']}")
        else:
            print("No last actions found.")
        return recalled_actions

    def suggest_based_on_pattern(self, pattern_key: str) -> Optional[Any]:
        """Suggests based on past patterns (placeholder for more advanced logic)."""
        # This is a simplified example. In a real scenario, this would involve
        # analyzing 'last_actions' or other stored data for recurring patterns.
        suggestion = self._data.get(f'pattern_suggestion_{pattern_key}')
        if suggestion:
            print(f"Suggestion for '{pattern_key}': {suggestion}")
        else:
            print(f"No pattern suggestion found for '{pattern_key}'.")
        return suggestion

    def _clear_all_data(self) -> None:
        """Clears all data from the memory engine (for testing/resetting)."""
        self._data = {}
        self._save_data()
        print("All memory data cleared.")

if __name__ == "__main__":
    # Sample Usage
    memory = MemoryEngine(storage_path='samantha_memory.json')

    print("--- Testing Preferences ---")
    memory.save_preference('default_browser', 'Google Chrome')
    memory.recall_preference('default_browser')
    memory.recall_preference('favorite_color') # Should not be found

    memory.save_preference('volume_level', 75)
    memory.recall_preference('volume_level')

    print("\n--- Testing Last Actions ---")
    memory.save_last_action('launch_app', {'app': 'VS Code', 'time': '2023-10-27T10:00:00'})
    memory.save_last_action('adjust_volume', {'level': 60, 'time': '2023-10-27T10:05:00'})
    memory.save_last_action('open_file', {'file': 'report.docx', 'time': '2023-10-27T10:15:00'})
    memory.recall_last_actions(2)
    memory.recall_last_actions(5) # Should recall all 3 if only 3 are saved

    print("\n--- Testing Suggestions ---")
    # Manually add a pattern suggestion for demonstration
    memory._data['pattern_suggestion_morning_routine'] = ['open_email', 'check_calendar']
    memory._save_data()

    memory.suggest_based_on_pattern('morning_routine')
    memory.suggest_based_on_pattern('evening_routine') # Should not be found

    print("\n--- Testing Forgetting ---")
    memory.forget_preference('volume_level')
    memory.recall_preference('volume_level')
    memory.forget_preference('non_existent_pref')

    # Clean up the test file
    # if os.path.exists('samantha_memory.json'):
    #     os.remove('samantha_memory.json')
    #     print("\nCleaned up samantha_memory.json")