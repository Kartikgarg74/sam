"""
Samantha AI MCP Server
Voice-controlled AI assistant with system automation
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import base64

from mcp.server import Server
from mcp.server import Session
from mcp.server.models import InitializationOptions
from mcp.stdio_server import StdioServerParameters, StdioServerTransport

# Import existing services
from backend.voice_processor import VoiceProcessor, VoiceCommand
from backend.system_automation import SystemAutomation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SamanthaAIMCPServer(Server):
    """Main MCP server for Samantha AI voice assistant"""

    def __init__(self):
        super().__init__(
            name="samantha-ai-voice-assistant",
            version="1.0.0"
        )

        # Initialize existing services
        self.voice_processor = VoiceProcessor()
        self.system_automation = SystemAutomation()

        logger.info("Samantha AI MCP Server initialized")

    async def initialize(self, session: Session, params: InitializationOptions):
        """Initialize MCP server with all tools and resources"""
        logger.info("Initializing MCP server...")

        # Register voice processing tools
        await session.register_tool("speech_to_text", self.speech_to_text)
        await session.register_tool("text_to_speech", self.text_to_speech)
        await session.register_tool("intent_classification", self.intent_classification)
        await session.register_tool("process_voice_command", self.process_voice_command)

        # Register system automation tools
        await session.register_tool("file_operation", self.file_operation)
        await session.register_tool("app_control", self.app_control)
        await session.register_tool("system_control", self.system_control)
        await session.register_tool("browser_automation", self.browser_automation)
        await session.register_tool("execute_automation", self.execute_automation)

        # Register voice resources
        await session.register_resource("supported_languages", self.get_supported_languages)
        await session.register_resource("command_patterns", self.get_command_patterns)
        await session.register_resource("voice_settings", self.get_voice_settings)

        # Register automation resources
        await session.register_resource("supported_operations", self.get_supported_operations)
        await session.register_resource("system_info", self.get_system_info)
        await session.register_resource("automation_status", self.get_automation_status)

        logger.info("MCP server initialization complete")

    # ============================================================================
    # VOICE PROCESSING TOOLS
    # ============================================================================

    async def speech_to_text(self, audio_data: str, language: str = 'en-US') -> Dict[str, Any]:
        """Convert speech to text using OpenAI Whisper"""
        try:
            logger.info(f"Processing speech to text with language: {language}")

            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)

            # Process through voice processor
            command = await self.voice_processor.process_audio(audio_bytes, language)

            return {
                "success": True,
                "text": command.original_text,
                "intent": command.intent,
                "confidence": command.confidence,
                "entities": command.entities,
                "timestamp": command.timestamp.isoformat()
            }
        except Exception as e:
            logger.error(f"Speech to text error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def text_to_speech(self, text: str, voice: str = 'alloy') -> Dict[str, Any]:
        """Convert text to speech using ElevenLabs"""
        try:
            logger.info(f"Converting text to speech: {text[:50]}...")

            # Create voice command for TTS
            command = VoiceCommand(
                id="tts_request",
                original_text=text,
                intent="text_to_speech",
                confidence=1.0,
                entities={"voice": voice},
                timestamp=datetime.now()
            )

            # Generate response
            response = await self.voice_processor.generate_response(command)

            return {
                "success": True,
                "audio_data": base64.b64encode(response.audio_data).decode() if response.audio_data else None,
                "duration": response.duration,
                "text": response.text
            }
        except Exception as e:
            logger.error(f"Text to speech error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def intent_classification(self, text: str) -> Dict[str, Any]:
        """Classify user intent from text"""
        try:
            logger.info(f"Classifying intent for text: {text[:50]}...")

            intent, confidence, entities = await self.voice_processor._extract_intent(text)

            return {
                "success": True,
                "intent": intent,
                "confidence": confidence,
                "entities": entities,
                "text": text
            }
        except Exception as e:
            logger.error(f"Intent classification error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def process_voice_command(self, audio_data: str, language: str = 'en-US') -> Dict[str, Any]:
        """Process voice command and return structured result"""
        try:
            logger.info("Processing voice command...")

            # Convert speech to text
            stt_result = await self.speech_to_text(audio_data, language)

            if not stt_result["success"]:
                return stt_result

            # Classify intent
            intent_result = await self.intent_classification(stt_result["text"])

            if not intent_result["success"]:
                return intent_result

            return {
                "success": True,
                "original_text": stt_result["text"],
                "intent": intent_result["intent"],
                "confidence": intent_result["confidence"],
                "entities": intent_result["entities"],
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Voice command processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================================================
    # SYSTEM AUTOMATION TOOLS
    # ============================================================================

    async def file_operation(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute file system operations"""
        try:
            logger.info(f"Executing file operation: {operation}")

            result = await self.system_automation.execute_command(operation, params)

            return {
                "success": result.success,
                "message": result.message,
                "data": result.data,
                "error": result.error,
                "execution_time": result.execution_time
            }
        except Exception as e:
            logger.error(f"File operation error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def app_control(self, action: str, app_name: str) -> Dict[str, Any]:
        """Control applications"""
        try:
            logger.info(f"Executing app control: {action} for {app_name}")

            result = await self.system_automation.execute_command(action, {"app_name": app_name})

            return {
                "success": result.success,
                "message": result.message,
                "data": result.data,
                "error": result.error,
                "execution_time": result.execution_time
            }
        except Exception as e:
            logger.error(f"App control error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def system_control(self, action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Control system settings"""
        try:
            logger.info(f"Executing system control: {action}")

            result = await self.system_automation.execute_command(action, params)

            return {
                "success": result.success,
                "message": result.message,
                "data": result.data,
                "error": result.error,
                "execution_time": result.execution_time
            }
        except Exception as e:
            logger.error(f"System control error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def browser_automation(self, browser: str, action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Automate browser operations"""
        try:
            logger.info(f"Executing browser automation: {browser} - {action}")

            command = f"{browser}_{action}"
            result = await self.system_automation.execute_command(command, params)

            return {
                "success": result.success,
                "message": result.message,
                "data": result.data,
                "error": result.error,
                "execution_time": result.execution_time
            }
        except Exception as e:
            logger.error(f"Browser automation error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def execute_automation(self, command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute any automation command"""
        try:
            logger.info(f"Executing automation command: {command}")

            result = await self.system_automation.execute_command(command, params)

            return {
                "success": result.success,
                "message": result.message,
                "data": result.data,
                "error": result.error,
                "execution_time": result.execution_time
            }
        except Exception as e:
            logger.error(f"Automation execution error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================================================
    # VOICE RESOURCES
    # ============================================================================

    async def get_supported_languages(self) -> Dict[str, Any]:
        """Get supported voice languages"""
        try:
            languages = self.voice_processor.get_supported_languages()
            return {
                "languages": languages,
                "count": len(languages)
            }
        except Exception as e:
            logger.error(f"Error getting supported languages: {str(e)}")
            return {
                "error": str(e)
            }

    async def get_command_patterns(self) -> Dict[str, Any]:
        """Get command patterns for intent recognition"""
        try:
            patterns = self.voice_processor.get_command_patterns()
            return {
                "patterns": patterns,
                "categories": list(patterns.keys())
            }
        except Exception as e:
            logger.error(f"Error getting command patterns: {str(e)}")
            return {
                "error": str(e)
            }

    async def get_voice_settings(self) -> Dict[str, Any]:
        """Get current voice settings"""
        try:
            return {
                "default_language": "en-US",
                "voice_model": "alloy",
                "speech_rate": 1.0,
                "volume": 1.0,
                "supported_voices": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
            }
        except Exception as e:
            logger.error(f"Error getting voice settings: {str(e)}")
            return {
                "error": str(e)
            }

    # ============================================================================
    # AUTOMATION RESOURCES
    # ============================================================================

    async def get_supported_operations(self) -> Dict[str, Any]:
        """Get supported automation operations"""
        try:
            operations = self.system_automation.get_supported_operations()
            return {
                "operations": operations,
                "os_type": self.system_automation.os_type
            }
        except Exception as e:
            logger.error(f"Error getting supported operations: {str(e)}")
            return {
                "error": str(e)
            }

    async def get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        try:
            return {
                "os_type": self.system_automation.os_type,
                "supported_browsers": list(self.system_automation.browser_automation.keys()),
                "system_apps": self.system_automation.system_apps.get(self.system_automation.os_type, {}),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting system info: {str(e)}")
            return {
                "error": str(e)
            }

    async def get_automation_status(self) -> Dict[str, Any]:
        """Get automation system status"""
        try:
            health = await self.system_automation.health_check()
            return {
                "status": health["status"],
                "available_operations": len(health.get("available_operations", [])),
                "last_error": health.get("last_error"),
                "uptime": health.get("uptime"),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting automation status: {str(e)}")
            return {
                "error": str(e)
            }

async def main():
    """Main entry point for MCP server"""
    logger.info("Starting Samantha AI MCP Server...")

    server = SamanthaAIMCPServer()

    # Run with stdio transport
    async with StdioServerTransport() as (read_stream, write_stream):
        await server.run(
            StdioServerParameters(
                read_stream=read_stream,
                write_stream=write_stream
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
