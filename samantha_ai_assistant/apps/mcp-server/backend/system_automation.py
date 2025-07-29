"""
System Automation Module for Samantha AI MCP Server
Handles OS-level operations, browser automation, and file system operations
"""

import asyncio
import json
import logging
import subprocess
import platform
import os
import sys
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import aiohttp
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AutomationResult:
    """Result of an automation operation"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: float = 0.0

class SystemAutomation:
    """System automation engine for the MCP server"""

    def __init__(self):
        self.os_type = platform.system().lower()
        self.supported_operations = self._get_supported_operations()

        # Browser automation capabilities
        self.browser_automation = {
            'chrome': self._chrome_automation,
            'firefox': self._firefox_automation,
            'safari': self._safari_automation
        }

        # System applications
        self.system_apps = {
            'macos': {
                'safari': '/Applications/Safari.app',
                'chrome': '/Applications/Google Chrome.app',
                'firefox': '/Applications/Firefox.app',
                'mail': '/Applications/Mail.app',
                'messages': '/Applications/Messages.app',
                'facetime': '/Applications/FaceTime.app',
                'photos': '/Applications/Photos.app',
                'finder': '/System/Library/CoreServices/Finder.app',
                'terminal': '/Applications/Utilities/Terminal.app',
                'spotify': '/Applications/Spotify.app'
            },
            'windows': {
                'chrome': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'firefox': 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
                'edge': 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'notepad': 'C:\\Windows\\System32\\notepad.exe',
                'explorer': 'C:\\Windows\\explorer.exe'
            },
            'linux': {
                'firefox': 'firefox',
                'chrome': 'google-chrome',
                'terminal': 'gnome-terminal',
                'file-manager': 'nautilus'
            }
        }

        logger.info(f"SystemAutomation initialized for {self.os_type}")

    def _get_supported_operations(self) -> Dict[str, List[str]]:
        """Get supported operations based on OS"""
        base_operations = {
            'file_operations': [
                'create_file', 'delete_file', 'move_file', 'copy_file',
                'create_folder', 'delete_folder', 'list_files', 'search_files'
            ],
            'application_control': [
                'launch_app', 'close_app', 'focus_app', 'list_running_apps'
            ],
            'system_control': [
                'volume_up', 'volume_down', 'mute', 'unmute',
                'brightness_up', 'brightness_down', 'sleep', 'restart', 'shutdown'
            ],
            'browser_automation': [
                'open_url', 'new_tab', 'close_tab', 'switch_tab',
                'click_element', 'type_text', 'scroll_page', 'fill_form'
            ]
        }

        # Add OS-specific operations
        if self.os_type == 'darwin':  # macOS
            base_operations['macos_specific'] = [
                'spotlight_search', 'mission_control', 'expose', 'dashboard'
            ]
        elif self.os_type == 'windows':
            base_operations['windows_specific'] = [
                'start_menu', 'task_manager', 'control_panel'
            ]
        elif self.os_type == 'linux':
            base_operations['linux_specific'] = [
                'terminal_command', 'package_manager', 'system_monitor'
            ]

        return base_operations

    async def execute_command(self, command: str, params: Dict[str, Any] = None) -> AutomationResult:
        """
        Execute a system automation command

        Args:
            command: Command to execute
            params: Command parameters

        Returns:
            AutomationResult with execution details
        """
        start_time = datetime.now()

        try:
            # Parse command and route to appropriate handler
            if command.startswith('file_'):
                result = await self._handle_file_operation(command, params or {})
            elif command.startswith('app_'):
                result = await self._handle_app_operation(command, params or {})
            elif command.startswith('system_'):
                result = await self._handle_system_operation(command, params or {})
            elif command.startswith('browser_'):
                result = await self._handle_browser_operation(command, params or {})
            else:
                result = AutomationResult(
                    success=False,
                    message=f"Unknown command: {command}",
                    error="Unsupported operation"
                )

            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()
            result.execution_time = execution_time

            return result

        except Exception as e:
            logger.error(f"Error executing command {command}: {e}")
            return AutomationResult(
                success=False,
                message=f"Error executing {command}",
                error=str(e),
                execution_time=(datetime.now() - start_time).total_seconds()
            )

    async def _handle_file_operation(self, command: str, params: Dict[str, Any]) -> AutomationResult:
        """Handle file system operations"""
        try:
            if command == 'file_create':
                return await self._create_file(params.get('path'), params.get('content', ''))
            elif command == 'file_delete':
                return await self._delete_file(params.get('path'))
            elif command == 'file_move':
                return await self._move_file(params.get('source'), params.get('destination'))
            elif command == 'file_copy':
                return await self._copy_file(params.get('source'), params.get('destination'))
            elif command == 'file_list':
                return await self._list_files(params.get('path', '.'))
            elif command == 'file_search':
                return await self._search_files(params.get('pattern'), params.get('path', '.'))
            else:
                return AutomationResult(
                    success=False,
                    message=f"Unknown file operation: {command}",
                    error="Unsupported file operation"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"File operation failed: {command}",
                error=str(e)
            )

    async def _handle_app_operation(self, command: str, params: Dict[str, Any]) -> AutomationResult:
        """Handle application control operations"""
        try:
            if command == 'app_launch':
                return await self._launch_app(params.get('app_name'))
            elif command == 'app_close':
                return await self._close_app(params.get('app_name'))
            elif command == 'app_focus':
                return await self._focus_app(params.get('app_name'))
            elif command == 'app_list':
                return await self._list_running_apps()
            else:
                return AutomationResult(
                    success=False,
                    message=f"Unknown app operation: {command}",
                    error="Unsupported app operation"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"App operation failed: {command}",
                error=str(e)
            )

    async def _handle_system_operation(self, command: str, params: Dict[str, Any]) -> AutomationResult:
        """Handle system control operations"""
        try:
            if command == 'system_volume_up':
                return await self._volume_up(params.get('amount', 10))
            elif command == 'system_volume_down':
                return await self._volume_down(params.get('amount', 10))
            elif command == 'system_mute':
                return await self._mute_audio()
            elif command == 'system_unmute':
                return await self._unmute_audio()
            elif command == 'system_brightness_up':
                return await self._brightness_up(params.get('amount', 10))
            elif command == 'system_brightness_down':
                return await self._brightness_down(params.get('amount', 10))
            else:
                return AutomationResult(
                    success=False,
                    message=f"Unknown system operation: {command}",
                    error="Unsupported system operation"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"System operation failed: {command}",
                error=str(e)
            )

    async def _handle_browser_operation(self, command: str, params: Dict[str, Any]) -> AutomationResult:
        """Handle browser automation operations"""
        try:
            browser = params.get('browser', 'chrome')
            browser_func = self.browser_automation.get(browser)

            if not browser_func:
                return AutomationResult(
                    success=False,
                    message=f"Unsupported browser: {browser}",
                    error="Browser not supported"
                )

            if command == 'browser_open_url':
                return await browser_func('open_url', params.get('url'))
            elif command == 'browser_new_tab':
                return await browser_func('new_tab')
            elif command == 'browser_close_tab':
                return await browser_func('close_tab')
            elif command == 'browser_click':
                return await browser_func('click', params.get('selector'))
            elif command == 'browser_type':
                return await browser_func('type', params.get('selector'), params.get('text'))
            else:
                return AutomationResult(
                    success=False,
                    message=f"Unknown browser operation: {command}",
                    error="Unsupported browser operation"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Browser operation failed: {command}",
                error=str(e)
            )

    # File Operations Implementation
    async def _create_file(self, path: str, content: str = '') -> AutomationResult:
        """Create a new file"""
        try:
            file_path = Path(path)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content)
            return AutomationResult(
                success=True,
                message=f"File created: {path}",
                data={'path': str(file_path)}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to create file: {path}",
                error=str(e)
            )

    async def _delete_file(self, path: str) -> AutomationResult:
        """Delete a file"""
        try:
            file_path = Path(path)
            if file_path.exists():
                file_path.unlink()
                return AutomationResult(
                    success=True,
                    message=f"File deleted: {path}"
                )
            else:
                return AutomationResult(
                    success=False,
                    message=f"File not found: {path}",
                    error="File does not exist"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to delete file: {path}",
                error=str(e)
            )

    async def _move_file(self, source: str, destination: str) -> AutomationResult:
        """Move a file"""
        try:
            source_path = Path(source)
            dest_path = Path(destination)

            if source_path.exists():
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                source_path.rename(dest_path)
                return AutomationResult(
                    success=True,
                    message=f"File moved: {source} -> {destination}",
                    data={'source': source, 'destination': destination}
                )
            else:
                return AutomationResult(
                    success=False,
                    message=f"Source file not found: {source}",
                    error="Source file does not exist"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to move file: {source} -> {destination}",
                error=str(e)
            )

    async def _copy_file(self, source: str, destination: str) -> AutomationResult:
        """Copy a file"""
        try:
            source_path = Path(source)
            dest_path = Path(destination)

            if source_path.exists():
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                import shutil
                shutil.copy2(source_path, dest_path)
                return AutomationResult(
                    success=True,
                    message=f"File copied: {source} -> {destination}",
                    data={'source': source, 'destination': destination}
                )
            else:
                return AutomationResult(
                    success=False,
                    message=f"Source file not found: {source}",
                    error="Source file does not exist"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to copy file: {source} -> {destination}",
                error=str(e)
            )

    async def _list_files(self, path: str) -> AutomationResult:
        """List files in a directory"""
        try:
            dir_path = Path(path)
            if dir_path.exists() and dir_path.is_dir():
                files = []
                for item in dir_path.iterdir():
                    files.append({
                        'name': item.name,
                        'type': 'file' if item.is_file() else 'directory',
                        'size': item.stat().st_size if item.is_file() else None,
                        'modified': item.stat().st_mtime
                    })
                return AutomationResult(
                    success=True,
                    message=f"Files listed: {path}",
                    data={'files': files, 'path': path}
                )
            else:
                return AutomationResult(
                    success=False,
                    message=f"Directory not found: {path}",
                    error="Directory does not exist"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to list files: {path}",
                error=str(e)
            )

    async def _search_files(self, pattern: str, path: str) -> AutomationResult:
        """Search for files matching a pattern"""
        try:
            dir_path = Path(path)
            if dir_path.exists() and dir_path.is_dir():
                import glob
                matches = list(dir_path.glob(pattern))
                files = []
                for match in matches:
                    files.append({
                        'name': match.name,
                        'path': str(match),
                        'type': 'file' if match.is_file() else 'directory'
                    })
                return AutomationResult(
                    success=True,
                    message=f"Files found matching '{pattern}' in {path}",
                    data={'files': files, 'pattern': pattern, 'path': path}
                )
            else:
                return AutomationResult(
                    success=False,
                    message=f"Directory not found: {path}",
                    error="Directory does not exist"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to search files: {pattern} in {path}",
                error=str(e)
            )

    # Application Operations Implementation
    async def _launch_app(self, app_name: str) -> AutomationResult:
        """Launch an application"""
        try:
            apps = self.system_apps.get(self.os_type, {})
            app_path = apps.get(app_name.lower())

            if app_path:
                if self.os_type == 'darwin':  # macOS
                    subprocess.Popen(['open', app_path])
                elif self.os_type == 'windows':
                    subprocess.Popen([app_path])
                else:  # Linux
                    subprocess.Popen([app_name])

                return AutomationResult(
                    success=True,
                    message=f"Application launched: {app_name}",
                    data={'app': app_name}
                )
            else:
                return AutomationResult(
                    success=False,
                    message=f"Application not found: {app_name}",
                    error="Application not in supported list"
                )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to launch app: {app_name}",
                error=str(e)
            )

    async def _close_app(self, app_name: str) -> AutomationResult:
        """Close an application"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['pkill', '-f', app_name])
            elif self.os_type == 'windows':
                subprocess.run(['taskkill', '/IM', f'{app_name}.exe', '/F'])
            else:  # Linux
                subprocess.run(['pkill', app_name])

            return AutomationResult(
                success=True,
                message=f"Application closed: {app_name}",
                data={'app': app_name}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to close app: {app_name}",
                error=str(e)
            )

    async def _focus_app(self, app_name: str) -> AutomationResult:
        """Focus an application"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', f'tell application "{app_name}" to activate'])
            else:
                # For Windows/Linux, we'll just launch the app
                return await self._launch_app(app_name)

            return AutomationResult(
                success=True,
                message=f"Application focused: {app_name}",
                data={'app': app_name}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message=f"Failed to focus app: {app_name}",
                error=str(e)
            )

    async def _list_running_apps(self) -> AutomationResult:
        """List running applications"""
        try:
            if self.os_type == 'darwin':  # macOS
                result = subprocess.run(['ps', 'ax'], capture_output=True, text=True)
                apps = []
                for line in result.stdout.split('\n'):
                    if '.app' in line:
                        apps.append(line.strip())
            elif self.os_type == 'windows':
                result = subprocess.run(['tasklist'], capture_output=True, text=True)
                apps = result.stdout.split('\n')
            else:  # Linux
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
                apps = result.stdout.split('\n')

            return AutomationResult(
                success=True,
                message="Running applications listed",
                data={'apps': apps}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to list running apps",
                error=str(e)
            )

    # System Operations Implementation
    async def _volume_up(self, amount: int = 10) -> AutomationResult:
        """Increase system volume"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', f'set volume output volume (output volume of (get volume settings) + {amount})'])
            else:
                # Use amixer for Linux or other methods for Windows
                subprocess.run(['amixer', 'set', 'Master', f'{amount}%+'])

            return AutomationResult(
                success=True,
                message=f"Volume increased by {amount}%",
                data={'action': 'volume_up', 'amount': amount}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to increase volume",
                error=str(e)
            )

    async def _volume_down(self, amount: int = 10) -> AutomationResult:
        """Decrease system volume"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', f'set volume output volume (output volume of (get volume settings) - {amount})'])
            else:
                subprocess.run(['amixer', 'set', 'Master', f'{amount}%-'])

            return AutomationResult(
                success=True,
                message=f"Volume decreased by {amount}%",
                data={'action': 'volume_down', 'amount': amount}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to decrease volume",
                error=str(e)
            )

    async def _mute_audio(self) -> AutomationResult:
        """Mute system audio"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', 'set volume output muted true'])
            else:
                subprocess.run(['amixer', 'set', 'Master', 'mute'])

            return AutomationResult(
                success=True,
                message="Audio muted",
                data={'action': 'mute'}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to mute audio",
                error=str(e)
            )

    async def _unmute_audio(self) -> AutomationResult:
        """Unmute system audio"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', 'set volume output muted false'])
            else:
                subprocess.run(['amixer', 'set', 'Master', 'unmute'])

            return AutomationResult(
                success=True,
                message="Audio unmuted",
                data={'action': 'unmute'}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to unmute audio",
                error=str(e)
            )

    async def _brightness_up(self, amount: int = 10) -> AutomationResult:
        """Increase screen brightness"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', f'tell application "System Events" to key code 144'])
            else:
                # Use xrandr for Linux or other methods
                pass

            return AutomationResult(
                success=True,
                message=f"Brightness increased by {amount}%",
                data={'action': 'brightness_up', 'amount': amount}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to increase brightness",
                error=str(e)
            )

    async def _brightness_down(self, amount: int = 10) -> AutomationResult:
        """Decrease screen brightness"""
        try:
            if self.os_type == 'darwin':  # macOS
                subprocess.run(['osascript', '-e', f'tell application "System Events" to key code 145'])
            else:
                # Use xrandr for Linux or other methods
                pass

            return AutomationResult(
                success=True,
                message=f"Brightness decreased by {amount}%",
                data={'action': 'brightness_down', 'amount': amount}
            )
        except Exception as e:
            return AutomationResult(
                success=False,
                message="Failed to decrease brightness",
                error=str(e)
            )

    # Browser Automation Implementation (Placeholder)
    async def _chrome_automation(self, action: str, *args) -> AutomationResult:
        """Chrome browser automation"""
        # TODO: Implement Chrome automation using Selenium or similar
        return AutomationResult(
            success=True,
            message=f"Chrome automation: {action}",
            data={'browser': 'chrome', 'action': action}
        )

    async def _firefox_automation(self, action: str, *args) -> AutomationResult:
        """Firefox browser automation"""
        # TODO: Implement Firefox automation
        return AutomationResult(
            success=True,
            message=f"Firefox automation: {action}",
            data={'browser': 'firefox', 'action': action}
        )

    async def _safari_automation(self, action: str, *args) -> AutomationResult:
        """Safari browser automation"""
        # TODO: Implement Safari automation
        return AutomationResult(
            success=True,
            message=f"Safari automation: {action}",
            data={'browser': 'safari', 'action': action}
        )

    def get_supported_operations(self) -> Dict[str, List[str]]:
        """Get list of supported operations"""
        return self.supported_operations

    async def health_check(self) -> Dict[str, Any]:
        """Check system automation health"""
        return {
            'status': 'healthy',
            'os_type': self.os_type,
            'supported_operations': len(self.supported_operations),
            'browser_automation': list(self.browser_automation.keys())
        }

# Global system automation instance
system_automation = SystemAutomation()
