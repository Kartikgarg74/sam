"""
AI processing service for Samantha AI Assistant
"""

import os
import openai
import logging
from typing import Dict, Any
import json

logger = logging.getLogger(__name__)

class AIProcessor:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if self.api_key:
            openai.api_key = self.api_key

        self.model = os.getenv('OPENAI_MODEL', 'gpt-4')
        self.max_tokens = int(os.getenv('OPENAI_MAX_TOKENS', '500'))
        self.temperature = float(os.getenv('OPENAI_TEMPERATURE', '0.7'))

    def process_command(self, transcription: str) -> str:
        """Process a voice/text command with AI"""
        try:
            if not self.api_key:
                return "I'm sorry, but AI processing is not configured. Please set up your OpenAI API key."

            system_prompt = self._get_system_prompt()

            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": transcription}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )

            return response.choices[0].message.content.strip()

        except openai.error.RateLimitError:
            logger.error("OpenAI API rate limit exceeded")
            return "I'm currently experiencing high demand. Please try again in a moment."

        except openai.error.InvalidRequestError as e:
            logger.error(f"Invalid OpenAI request: {str(e)}")
            return "I'm sorry, I couldn't process that request. Please try rephrasing."

        except openai.error.AuthenticationError:
            logger.error("OpenAI API authentication failed")
            return "I'm sorry, there's an authentication issue with the AI service."

        except Exception as e:
            logger.error(f"Error processing AI command: {str(e)}")
            return "I'm sorry, I encountered an error while processing your request."

    def _get_system_prompt(self) -> str:
        """Get the system prompt for Samantha AI"""
        return """
        You are Samantha, an intelligent AI assistant that can help control computers remotely through voice commands.

        Your capabilities include:
        - Opening applications and programs
        - File and folder management (create, delete, move, copy)
        - System information and monitoring
        - Web browsing assistance
        - Basic automation tasks
        - Answering questions and providing information
        - Helping with productivity tasks

        Guidelines for responses:
        1. Be helpful, friendly, and conversational
        2. Provide clear, step-by-step instructions when needed
        3. Ask for clarification if a request is ambiguous
        4. Explain what you're doing and why
        5. Be proactive in suggesting related actions
        6. Keep responses concise but informative
        7. Use a warm, personal tone as if you're a helpful assistant

        When users ask you to perform system actions:
        - Explain what the action will do
        - Provide the specific steps or commands needed
        - Mention any potential risks or considerations
        - Offer alternatives when appropriate

        Remember: You are Samantha, a sophisticated AI assistant designed to make computer interaction easier and more intuitive through natural conversation.
        """

    def analyze_intent(self, text: str) -> Dict[str, Any]:
        """Analyze the intent of a user's command"""
        try:
            if not self.api_key:
                return {"intent": "unknown", "confidence": 0.0}

            intent_prompt = """
            Analyze the following user command and determine the intent. Respond with a JSON object containing:
            - intent: The primary intent (e.g., "open_application", "file_management", "system_info", "web_search", "question", "automation")
            - confidence: A confidence score from 0.0 to 1.0
            - entities: Any specific entities mentioned (applications, files, etc.)
            - action: The specific action requested

            User command: {text}

            Respond only with valid JSON.
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": intent_prompt.format(text=text)}
                ],
                max_tokens=200,
                temperature=0.3
            )

            result = json.loads(response.choices[0].message.content.strip())
            return result

        except Exception as e:
            logger.error(f"Error analyzing intent: {str(e)}")
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "entities": [],
                "action": "unknown"
            }

    def generate_command_suggestions(self, context: str) -> list:
        """Generate command suggestions based on context"""
        try:
            if not self.api_key:
                return []

            suggestion_prompt = """
            Based on the following context, suggest 3-5 helpful voice commands that the user might want to try next.
            Focus on practical, actionable commands that would be useful for computer control.

            Context: {context}

            Respond with a simple list of suggested commands, one per line.
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": suggestion_prompt.format(context=context)}
                ],
                max_tokens=200,
                temperature=0.7
            )

            suggestions = response.choices[0].message.content.strip().split('\n')
            return [s.strip('- ').strip() for s in suggestions if s.strip()]

        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            return []

    def process_follow_up(self, original_command: str, follow_up: str, previous_response: str) -> str:
        """Process a follow-up command with context"""
        try:
            if not self.api_key:
                return "I'm sorry, but AI processing is not configured."

            context_prompt = f"""
            You are Samantha, an AI assistant. Here's the conversation context:

            Original command: {original_command}
            Your previous response: {previous_response}
            Follow-up command: {follow_up}

            Respond to the follow-up command, taking into account the previous conversation context.
            """

            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": context_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"Error processing follow-up: {str(e)}")
            return "I'm sorry, I couldn't process that follow-up request."

    def is_available(self) -> bool:
        """Check if AI processing is available"""
        return bool(self.api_key)

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current AI model"""
        return {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "available": self.is_available()
        }
