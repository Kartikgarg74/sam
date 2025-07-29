# OS Automation Module

This module provides functionalities to interact with the underlying operating system, allowing Samantha AI Assistant to perform various local OS commands based on natural language instructions.

## Supported Actions:

- `launch_app`: Launch a specified application.
- `close_app`: Close a specified application.
- `adjust_volume`: Adjust the system volume to a specified level (0-100).
- `control_brightness`: Control screen brightness (platform-specific, currently limited).
- `open_file`: Open a specified file.
- `delete_file`: Delete a specified file.
- `shutdown_system`: Shut down the operating system.
- `restart_system`: Restart the operating system.

## Dry Run Mode:

The module includes a "dry run" mode for safety. When `dry_run` is enabled, commands will not be executed but will instead print what *would* have been executed. This is useful for testing and debugging without making actual system changes.

## Usage:

```python
from os_command_executor import OSCommandExecutor

# Initialize with dry_run=True for testing, or dry_run=False for live execution
executor = OSCommandExecutor(dry_run=True)

# Example Usage (Dry Run):
print("--- Dry Run Tests ---")
executor.launch_app("Google Chrome")
executor.adjust_volume(50)
executor.open_file("/path/to/your/document.txt")
executor.delete_file("/path/to/your/temp_file.txt")
executor.shutdown_system()

# Example Usage (Live Execution - Uncomment with caution!):
# executor_live = OSCommandExecutor(dry_run=False)
# print("\nLaunching Calculator...")
# result = executor_live.launch_app("Calculator")
# print(result)

# print("\nAdjusting volume to 20...")
# result = executor_live.adjust_volume(20)
# print(result)

# print("\nOpening a non-existent file (expect error)...")
# result = executor_live.open_file("non_existent_file.txt")
# print(result)

# print("\nAttempting to delete a non-existent file (expect error)...")
# result = executor_live.delete_file("non_existent_file_to_delete.txt")
# print(result)

# print("\nAttempting to shutdown (DANGER! Uncomment with caution)...")
# result = executor_live.shutdown_system()
# print(result)
```

## Dependencies:

This module primarily uses built-in Python modules like `subprocess`, `os`, and `platform`. Specific functionalities like volume and brightness control might require platform-specific tools or additional libraries (e.g., `pyautogui` for cross-platform GUI automation, or `osascript` on macOS, `amixer` on Linux). These are noted in the `os_command_executor.py` file where applicable.