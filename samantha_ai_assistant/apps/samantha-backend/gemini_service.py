import os
import json
from typing import Dict, Any, Optional

import google.generativeai as genai

# Placeholder for local LLM (e.g., LaMini)
# from local_llm import LaMini

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.gemini_api_key = api_key if api_key else os.getenv("GOOGLE_API_KEY")
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
        else:
            self.gemini_model = None

        # Initialize local fallback model
        # self.local_llm = LaMini()

    def query(self, user_query: str, system_prompt: str) -> Dict[str, Any]:
        """Accepts a user query and system prompt, sends to Gemini, and extracts JSON commands."""
        if not self.gemini_model:
            print("Warning: Gemini model not initialized. Falling back to local model.")
            return self.fallback(user_query, system_prompt)

        try:
            response = self.gemini_model.generate_content(f"{system_prompt}\n{user_query}")
            text_response = response.text

            json_commands = self._extract_json_commands(text_response)
            return {"text": text_response, "commands": json_commands}
        except Exception as e:
            print(f"Error calling Gemini API: {e}. Falling back to local model.")
            return self.fallback(user_query, system_prompt)

    def fallback(self, user_query: str, system_prompt: str) -> Dict[str, Any]:
        """Fallback to a local LLM (e.g., LaMini) if Gemini fails or API key is missing."""
        print("Using fallback local LLM.")
        # Placeholder for actual local LLM call
        # local_response = self.local_llm.generate(f"{system_prompt}\n{user_query}")
        # json_commands = self._extract_json_commands(local_response)

        # Mock local response
        local_response = f"Local LLM response to: {user_query}. System prompt: {system_prompt}"
        if "local command" in user_query.lower():
            local_response += "\n```json\n{\"action\": \"local_test\", \"param\": \"local_value\"}\n```"

        json_commands = self._extract_json_commands(local_response)
        return {"text": local_response, "commands": json_commands}

    def _extract_json_commands(self, text: str) -> Optional[Dict[str, Any]]:
        """Extracts structured JSON commands from the LLM's text response."""
        try:
            # Look for a JSON block indicated by ```json ... ```
            start_idx = text.find('```json')
            if start_idx != -1:
                end_idx = text.find('```', start_idx + len('```json'))
                if end_idx != -1:
                    json_str = text[start_idx + len('```json'):end_idx].strip()
                    return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from LLM response: {e}")
        return None