import asyncio
import logging
import json
from typing import Dict, Any, Optional, List
import google.generativeai as genai
from config.settings import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.gemini_model = None
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 1024,
        }
        
    async def initialize(self):
        """Initialize Gemini 2.5 Flash"""
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel(
                'gemini-2.5-flash',
                generation_config=self.generation_config
            )
            logger.info("✅ Gemini 2.5 Flash initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini: {e}")
            raise
    
    async def classify_intent(self, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Enhanced intent classification using Gemini 2.5 Flash"""
        try:
            prompt = f"""
            You are Samantha, a voice assistant for Mac automation. Analyze this command and classify the intent.

            User Command: "{user_input}"
            Context: {json.dumps(context or {})}

            AVAILABLE INTENTS:
            1. SPOTIFY_CONTROL (play, pause, next, previous, volume, search)
            2. BROWSER_AUTOMATION (open website, search, navigate)
            3. SYSTEM_AUTOMATION (open app, close app, volume, brightness)
            4. WHATSAPP_MESSAGING (send message, read messages)
            5. INFORMATION_REQUEST (weather, time, general questions)
            6. CONVERSATION (greetings, casual talk)

            Respond with JSON format:
            {{
                "intent": "INTENT_NAME",
                "confidence": 0.95,
                "entities": {{"key": "value"}},
                "action": "specific_action",
                "parameters": {{}},
                "response_text": "What I should say to user"
            }}
            """
            
            response = await self.gemini_model.generate_content_async(prompt)
            
            # Parse JSON response 
            try:
                result = json.loads(response.text.strip())
                return {
                    "success": True,
                    "classification": result,
                    "model": "gemini-2.5-flash"
                }
            except json.JSONDecodeError:
                # Fallback parsing 
                return await self._fallback_classification(user_input)
                
        except Exception as e:
            logger.error(f"Intent classification failed: {e}")
            return {"error": str(e), "success": False}
    
    async def _fallback_classification(self, user_input: str) -> Dict[str, Any]:
        """Fallback classification using keyword matching"""
        keywords = {
            "SPOTIFY_CONTROL": ["play", "pause", "music", "song", "spotify", "volume", "next", "previous"],
            "BROWSER_AUTOMATION": ["open", "browse", "website", "google", "search"],
            "SYSTEM_AUTOMATION": ["open", "close", "app", "application", "brightness", "volume"],
            "WHATSAPP_MESSAGING": ["whatsapp", "message", "send", "text"],
            "INFORMATION_REQUEST": ["what", "when", "where", "how", "weather", "time"],
            "CONVERSATION": ["hello", "hi", "thank", "bye", "how are you"]
        }
        
        user_lower = user_input.lower()
        for intent, words in keywords.items():
            if any(word in user_lower for word in words):
                return {
                    "success": True,
                    "classification": {
                        "intent": intent,
                        "confidence": 0.7,
                        "entities": {},
                        "action": "process_command",
                        "parameters": {"text": user_input},
                        "response_text": "I'll help you with that."
                    },
                    "model": "fallback"
                }
        
        return {
            "success": True,
            "classification": {
                "intent": "CONVERSATION",
                "confidence": 0.5,
                "entities": {},
                "action": "general_response",
                "parameters": {},
                "response_text": "I'm not sure how to help with that, but I'm here to assist you."
            },
            "model": "fallback"
        }

    async def generate_response(self, intent_result: Dict[str, Any], execution_result: Dict[str, Any]) -> str:
        """Generate contextual response based on intent and execution results"""
        try:
            prompt = f"""
            Generate a natural voice response for Samantha AI assistant.
            
            Intent: {intent_result.get('classification', {}).get('intent')}
            Action taken: {execution_result.get('action', 'none')}
            Success: {execution_result.get('success', False)}
            Details: {execution_result.get('message', '')}
            
            Generate a brief, friendly response (max 50 words) that Samantha would say.
            """
            
            response = await self.gemini_model.generate_content_async(prompt)
            return response.text.strip()
            
        except Exception