"""
Simple Samantha AI MCP Server
Voice-controlled AI assistant with system automation
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import base64

from mcp.server import Server
from mcp import StdioServerParameters
from mcp.stdio_server import StdioServerTransport

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

        # Register tools
        self._register_tools()

    def _register_tools(self):
        """Register all MCP tools"""

        # Voice processing tools
        @self.call_tool()
        async def speech_to_text(audio_data: str, language: str = 'en-US') -> Dict[str, Any]:
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

        @self.call_tool()
        async def text_to_speech(text: str, voice: str = 'alloy') -> Dict[str, Any]:
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

        @self.call_tool()
        async def intent_classification(text: str) -> Dict[str, Any]:
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

        # System automation tools
        @self.call_tool()
        async def file_operation(operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
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

        @self.call_tool()
        async def app_control(action: str, app_name: str) -> Dict[str, Any]:
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

        @self.call_tool()
        async def system_control(action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
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

        @self.call_tool()
        async def browser_automation(browser: str, action: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
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

        @self.call_tool()
        async def execute_automation(command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
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

        # Health check tool
        @self.call_tool()
        async def get_system_health() -> Dict[str, Any]:
            """Get system health status"""
            try:
                voice_health = await self.voice_processor.health_check()
                automation_health = await self.system_automation.health_check()

                return {
                    "status": "healthy" if voice_health["status"] == "healthy" and automation_health["status"] == "healthy" else "degraded",
                    "voice_processor": voice_health,
                    "system_automation": automation_health,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                logger.error(f"Health check error: {str(e)}")
                return {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
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
