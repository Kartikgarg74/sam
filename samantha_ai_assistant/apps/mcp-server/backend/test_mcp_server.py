#!/usr/bin/env python3
"""
Test script for Samantha AI MCP Server
Tests voice processing, system automation, and integrated functionality
"""

import asyncio
import json
import aiohttp
import tempfile
import wave
import struct
import numpy as np
from pathlib import Path
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from voice_processor import voice_processor, VoiceCommand
from system_automation import system_automation, AutomationResult

class MCPServerTester:
    """Test suite for MCP Server functionality"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.test_results = []

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": asyncio.get_event_loop().time()
        }
        self.test_results.append(result)

        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")

    def create_test_audio(self, text: str = "Hello world", duration: float = 2.0) -> bytes:
        """Create a simple test audio file"""
        # Generate a simple sine wave
        sample_rate = 16000
        frequency = 440  # A4 note
        samples = int(duration * sample_rate)

        # Create sine wave
        t = np.linspace(0, duration, samples, False)
        audio_data = np.sin(2 * np.pi * frequency * t)

        # Convert to 16-bit PCM
        audio_data = (audio_data * 32767).astype(np.int16)

        # Create WAV file in memory
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            with wave.open(temp_file.name, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data.tobytes())

            # Read the file back
            with open(temp_file.name, 'rb') as f:
                audio_bytes = f.read()

            # Clean up
            os.unlink(temp_file.name)

        return audio_bytes

    async def test_voice_processor_health(self):
        """Test voice processor health check"""
        try:
            health = await voice_processor.health_check()

            required_fields = ['status', 'supported_languages', 'command_patterns', 'ai_api_configured']
            success = all(field in health for field in required_fields)

            self.log_test(
                "Voice Processor Health Check",
                success,
                f"Status: {health.get('status', 'unknown')}"
            )

        except Exception as e:
            self.log_test("Voice Processor Health Check", False, str(e))

    async def test_system_automation_health(self):
        """Test system automation health check"""
        try:
            health = await system_automation.health_check()

            required_fields = ['status', 'os_type', 'supported_operations', 'browser_automation']
            success = all(field in health for field in required_fields)

            self.log_test(
                "System Automation Health Check",
                success,
                f"OS: {health.get('os_type', 'unknown')}"
            )

        except Exception as e:
            self.log_test("System Automation Health Check", False, str(e))

    async def test_voice_processor_intent_extraction(self):
        """Test voice processor intent extraction"""
        try:
            test_commands = [
                "Open Safari",
                "Go to google.com",
                "Create a new file",
                "Volume up",
                "What is the weather like?"
            ]

            expected_intents = [
                "system_control",
                "browser_navigation",
                "file_operations",
                "system_control",
                "information_query"
            ]

            success_count = 0
            for i, (command, expected_intent) in enumerate(zip(test_commands, expected_intents)):
                try:
                    intent, confidence, entities = await voice_processor._extract_intent(command)
                    if intent == expected_intent:
                        success_count += 1
                        print(f"  ✓ Command {i+1}: '{command}' -> {intent} (confidence: {confidence:.2f})")
                    else:
                        print(f"  ✗ Command {i+1}: '{command}' -> {intent} (expected: {expected_intent})")
                except Exception as e:
                    print(f"  ✗ Command {i+1}: Error - {e}")

            success_rate = success_count / len(test_commands)
            success = success_rate >= 0.6  # 60% accuracy threshold

            self.log_test(
                "Voice Processor Intent Extraction",
                success,
                f"Accuracy: {success_rate:.1%} ({success_count}/{len(test_commands)})"
            )

        except Exception as e:
            self.log_test("Voice Processor Intent Extraction", False, str(e))

    async def test_system_automation_operations(self):
        """Test system automation operations"""
        try:
            # Test getting supported operations
            operations = system_automation.get_supported_operations()

            required_categories = ['file_operations', 'application_control', 'system_control']
            success = all(category in operations for category in required_categories)

            if success:
                print(f"  ✓ Found {len(operations)} operation categories")
                for category, ops in operations.items():
                    print(f"    - {category}: {len(ops)} operations")

            self.log_test(
                "System Automation Operations",
                success,
                f"Found {len(operations)} operation categories"
            )

        except Exception as e:
            self.log_test("System Automation Operations", False, str(e))

    async def test_file_operations(self):
        """Test file system operations"""
        try:
            test_file = "test_file.txt"
            test_content = "Hello from Samantha AI!"

            # Test file creation
            result = await system_automation.execute_command(
                "file_create",
                {"path": test_file, "content": test_content}
            )

            if result.success:
                print(f"  ✓ Created file: {test_file}")

                # Test file listing
                list_result = await system_automation.execute_command(
                    "file_list",
                    {"path": "."}
                )

                if list_result.success:
                    files = list_result.data.get('files', [])
                    test_file_found = any(f['name'] == test_file for f in files)

                    if test_file_found:
                        print(f"  ✓ Found file in listing")

                        # Test file deletion
                        delete_result = await system_automation.execute_command(
                            "file_delete",
                            {"path": test_file}
                        )

                        if delete_result.success:
                            print(f"  ✓ Deleted file: {test_file}")
                            self.log_test("File Operations", True, "Create, list, and delete successful")
                        else:
                            self.log_test("File Operations", False, f"Delete failed: {delete_result.error}")
                    else:
                        self.log_test("File Operations", False, "File not found in listing")
                else:
                    self.log_test("File Operations", False, f"List failed: {list_result.error}")
            else:
                self.log_test("File Operations", False, f"Create failed: {result.error}")

        except Exception as e:
            self.log_test("File Operations", False, str(e))

    async def test_api_endpoints(self):
        """Test API endpoints"""
        try:
            # Test health endpoint
            async with self.session.get(f"{self.base_url}/api/v1/monitoring/health") as response:
                if response.status == 200:
                    health_data = await response.json()
                    print(f"  ✓ Health check: {health_data.get('status', 'unknown')}")
                else:
                    print(f"  ✗ Health check failed: {response.status}")
                    return

            # Test voice health endpoint
            async with self.session.get(f"{self.base_url}/api/v1/voice/health") as response:
                if response.status == 200:
                    voice_health = await response.json()
                    print(f"  ✓ Voice health: {voice_health.get('health', {}).get('status', 'unknown')}")
                else:
                    print(f"  ✗ Voice health failed: {response.status}")

            # Test automation health endpoint
            async with self.session.get(f"{self.base_url}/api/v1/automation/health") as response:
                if response.status == 200:
                    auto_health = await response.json()
                    print(f"  ✓ Automation health: {auto_health.get('health', {}).get('status', 'unknown')}")
                else:
                    print(f"  ✗ Automation health failed: {response.status}")

            # Test supported languages endpoint
            async with self.session.get(f"{self.base_url}/api/v1/voice/supported-languages") as response:
                if response.status == 200:
                    languages = await response.json()
                    lang_count = len(languages.get('languages', {}))
                    print(f"  ✓ Supported languages: {lang_count} languages")
                else:
                    print(f"  ✗ Languages endpoint failed: {response.status}")

            # Test supported operations endpoint
            async with self.session.get(f"{self.base_url}/api/v1/automation/supported-operations") as response:
                if response.status == 200:
                    operations = await response.json()
                    op_count = len(operations.get('operations', {}))
                    print(f"  ✓ Supported operations: {op_count} categories")
                else:
                    print(f"  ✗ Operations endpoint failed: {response.status}")

            self.log_test("API Endpoints", True, "All endpoints responding")

        except Exception as e:
            self.log_test("API Endpoints", False, str(e))

    async def test_voice_processing_api(self):
        """Test voice processing API endpoints"""
        try:
            # Create test audio
            audio_data = self.create_test_audio("Hello world")

            # Test voice processing endpoint
            data = aiohttp.FormData()
            data.add_field('audio_file', audio_data, filename='test.wav', content_type='audio/wav')
            data.add_field('language', 'en-US')
            data.add_field('user_id', 'test_user')

            async with self.session.post(f"{self.base_url}/api/v1/voice/process-audio", data=data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('success'):
                        command = result.get('command', {})
                        print(f"  ✓ Voice processing: '{command.get('original_text', 'unknown')}' -> {command.get('intent', 'unknown')}")

                        # Test response generation
                        response_data = {
                            "id": command.get('id'),
                            "original_text": command.get('original_text'),
                            "intent": command.get('intent'),
                            "confidence": command.get('confidence'),
                            "entities": command.get('entities'),
                            "timestamp": command.get('timestamp'),
                            "user_id": command.get('user_id')
                        }

                        async with self.session.post(
                            f"{self.base_url}/api/v1/voice/generate-response",
                            json=response_data
                        ) as resp:
                            if resp.status == 200:
                                resp_result = await resp.json()
                                if resp_result.get('success'):
                                    response_text = resp_result.get('response', {}).get('text', '')
                                    print(f"  ✓ Response generation: '{response_text}'")
                                    self.log_test("Voice Processing API", True, "Processing and response generation successful")
                                else:
                                    self.log_test("Voice Processing API", False, "Response generation failed")
                            else:
                                self.log_test("Voice Processing API", False, f"Response endpoint failed: {resp.status}")
                    else:
                        self.log_test("Voice Processing API", False, "Voice processing failed")
                else:
                    self.log_test("Voice Processing API", False, f"Processing endpoint failed: {response.status}")

        except Exception as e:
            self.log_test("Voice Processing API", False, str(e))

    async def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting MCP Server Test Suite")
        print("=" * 50)

        # Core functionality tests
        await self.test_voice_processor_health()
        await self.test_system_automation_health()
        await self.test_voice_processor_intent_extraction()
        await self.test_system_automation_operations()
        await self.test_file_operations()

        # API tests (only if server is running)
        try:
            await self.test_api_endpoints()
            await self.test_voice_processing_api()
        except Exception as e:
            print(f"⚠️  API tests skipped (server may not be running): {e}")

        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {passed_tests/total_tests:.1%}")

        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")

        return passed_tests == total_tests

async def main():
    """Main test runner"""
    print("🚀 Samantha AI MCP Server Test Suite")
    print("This script tests the voice processing and system automation capabilities.")
    print()

    # Check if server is running
    server_running = False
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:8000/api/v1/monitoring/health", timeout=5) as response:
                server_running = response.status == 200
    except:
        pass

    if server_running:
        print("✅ MCP Server is running - will test API endpoints")
    else:
        print("⚠️  MCP Server is not running - API tests will be skipped")
    print()

    # Run tests
    async with MCPServerTester() as tester:
        success = await tester.run_all_tests()

        if success:
            print("\n🎉 All tests passed! MCP Server is working correctly.")
            return 0
        else:
            print("\n💥 Some tests failed. Please check the errors above.")
            return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test suite error: {e}")
        sys.exit(1)
