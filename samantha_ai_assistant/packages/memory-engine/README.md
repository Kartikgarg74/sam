# Memory Engine Module

This module provides a minimal memory engine for Samantha AI Assistant, designed to store and retrieve user preferences, recall past actions, and suggest based on learned patterns. It uses a local JSON file as its storage mechanism.

## Features:

- **Save Preferences**: Store key-value pairs for user preferences (e.g., default browser, volume level).
- **Recall Last Actions**: Keep a history of recently performed actions to understand user workflow.
- **Suggest Based on Patterns**: (Placeholder) Future functionality to provide suggestions based on recurring user patterns.
- **Forget Data**: Ability to remove specific preferences from memory.

## Storage:

Data is stored in a local JSON file (default: `memory.json`) within the module's directory. This allows for persistent storage across sessions.

## Usage:

```python
from memory_engine import MemoryEngine
import os

# Initialize the memory engine with a specific storage path
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

# Clean up the test file (uncomment to run)
# if os.path.exists('samantha_memory.json'):
#     os.remove('samantha_memory.json')
#     print("\nCleaned up samantha_memory.json")
```

## Dependencies:

This module uses only built-in Python modules (`json`, `os`). No external dependencies are required.