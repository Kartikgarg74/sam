import subprocess
import os
import platform
import sys

class OSCommandExecutor:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run

    def _execute_command(self, command, shell=False):
        if self.dry_run:
            print(f"[Dry Run] Would execute: {' '.join(command) if isinstance(command, list) else command}")
            return {"status": "dry_run", "output": "", "error": ""}
        try:
            result = subprocess.run(command, shell=shell, capture_output=True, text=True, check=True)
            return {"status": "success", "output": result.stdout, "error": result.stderr}
        except subprocess.CalledProcessError as e:
            return {"status": "error", "output": e.stdout, "error": e.stderr}
        except FileNotFoundError:
            return {"status": "error", "output": "", "error": f"Command not found: {command[0] if isinstance(command, list) else command}"}
        except Exception as e:
            return {"status": "error", "output": "", "error": str(e)}

    def launch_app(self, app_name):
        if platform.system() == "Darwin":  # macOS
            return self._execute_command(["open", "-a", app_name])
        elif platform.system() == "Windows":
            return self._execute_command(["start", app_name], shell=True)
        else:  # Linux
            return self._execute_command(["xdg-open", app_name])

    def close_app(self, app_name):
        if platform.system() == "Darwin":  # macOS
            # This attempts to kill the process by name, might not be graceful
            return self._execute_command(["pkill", "-a", app_name])
        elif platform.system() == "Windows":
            # Taskkill by image name, /F for force, /IM for image name
            return self._execute_command(["taskkill", "/F", "/IM", f"{app_name}.exe"], shell=True)
        else:  # Linux
            return self._execute_command(["pkill", app_name])

    def adjust_volume(self, level):
        # This requires platform-specific tools
        if platform.system() == "Darwin":  # macOS
            # Requires 'osascript' for AppleScript or 'SwitchAudioSource' (third-party)
            # For simplicity, let's assume a basic 'osascript' for setting system volume
            # Volume is 0-100
            return self._execute_command(["osascript", "-e", f"set volume output volume {level}"])
        elif platform.system() == "Windows":
            # Requires external tools or pycaw/comtypes for direct control
            # Not directly supported by simple subprocess.run
            return {"status": "error", "output": "", "error": "Volume control not directly supported on Windows via simple commands."}
        else:  # Linux
            # Uses 'amixer' for ALSA or 'pactl' for PulseAudio
            # Assuming ALSA for now
            return self._execute_command(["amixer", "set", "Master", f"{level}%"])

    def control_brightness(self, level):
        # This requires platform-specific tools
        if platform.system() == "Darwin":  # macOS
            # Requires 'brightness' (third-party tool) or AppleScript
            # For simplicity, not directly supported by simple subprocess.run
            return {"status": "error", "output": "", "error": "Brightness control not directly supported on macOS via simple commands."}
        elif platform.system() == "Windows":
            # Requires WMI or external tools
            return {"status": "error", "output": "", "error": "Brightness control not directly supported on Windows via simple commands."}
        else:  # Linux
            # Uses 'xrandr' or 'xbacklight' for Xorg, or direct sysfs for some systems
            # Assuming 'xrandr' for now (requires display name, e.g., eDP-1)
            # This is a placeholder and needs more context for actual implementation
            return {"status": "error", "output": "", "error": "Brightness control not directly supported on Linux via simple commands."}

    def open_file(self, file_path):
        if platform.system() == "Darwin":  # macOS
            return self._execute_command(["open", file_path])
        elif platform.system() == "Windows":
            return self._execute_command(["start", file_path], shell=True)
        else:  # Linux
            return self._execute_command(["xdg-open", file_path])

    def delete_file(self, file_path):
        # Use os.remove for files, os.rmdir for empty directories, shutil.rmtree for non-empty directories
        if self.dry_run:
            print(f"[Dry Run] Would delete: {file_path}")
            return {"status": "dry_run", "output": "", "error": ""}
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
                return {"status": "success", "output": f"File {file_path} deleted.", "error": ""}
            elif os.path.isdir(file_path):
                # For directories, we need to be careful. For now, only allow empty dir deletion or require shutil
                # For simplicity, let's just say it's not supported for non-empty dirs via this method
                return {"status": "error", "output": "", "error": "Deleting directories is not supported via this method. Use shutil.rmtree for non-empty directories."}
            else:
                return {"status": "error", "output": "", "error": f"Path not found or is not a file: {file_path}"}
        except OSError as e:
            return {"status": "error", "output": "", "error": str(e)}

    def shutdown_system(self):
        if platform.system() == "Darwin":  # macOS
            return self._execute_command(["osascript", "-e", 'tell app "System Events" to shut down'])
        elif platform.system() == "Windows":
            return self._execute_command(["shutdown", "/s", "/t", "0"], shell=True)
        else:  # Linux
            return self._execute_command(["systemctl", "poweroff"])

    def restart_system(self):
        if platform.system() == "Darwin":  # macOS
            return self._execute_command(["osascript", "-e", 'tell app "System Events" to restart'])
        elif platform.system() == "Windows":
            return self._execute_command(["shutdown", "/r", "/t", "0"], shell=True)
        else:  # Linux
            return self._execute_command(["systemctl", "reboot"])





import json
import sys

if __name__ == "__main__":
    executor = OSCommandExecutor(dry_run=False) # Set to False for live execution when called from external process

    # Read JSON input from stdin
    input_json = sys.stdin.read()
    try:
        command_data = json.loads(input_json)
        action = command_data.get("action")
        params = command_data.get("params", {})

        result = {"status": "error", "output": "", "error": "Unsupported action"}

        if action == "launch_app":
            result = executor.launch_app(params.get("target"))
        elif action == "close_app":
            result = executor.close_app(params.get("target"))
        elif action == "adjust_volume":
            result = executor.adjust_volume(params.get("level"))
        elif action == "control_brightness":
            result = executor.control_brightness(params.get("level"))
        elif action == "open_file":
            result = executor.open_file(params.get("path"))
        elif action == "delete_file":
            result = executor.delete_file(params.get("path"))
        elif action == "shutdown":
            result = executor.shutdown_system()
        elif action == "restart":
            result = executor.restart_system()
        
        print(json.dumps(result))

    except json.JSONDecodeError:
        print(json.dumps({"status": "error", "output": "", "error": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"status": "error", "output": "", "error": str(e)}))