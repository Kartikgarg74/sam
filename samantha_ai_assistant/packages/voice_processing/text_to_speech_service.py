import json
import sys
import os

from elevenlabs import set_api_key, generate, play

# Placeholder for ElevenLabs Text-to-Speech
class TextToSpeechService:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
        if not self.api_key:
            print("Warning: ELEVENLABS_API_KEY not provided. Text-to-speech will be simulated.")
            # raise ValueError("ELEVENLABS_API_KEY must be provided or set as an environment variable.")
        # Initialize ElevenLabs client here if using a library

    def convert_text_to_speech(self, text, output_file_path="output.mp3", voice_id="default"):
        print(f"Converting text to speech: '{text[:50]}...' to {output_file_path} using voice '{voice_id}'...")

        if self.api_key:
            set_api_key(self.api_key)
            audio = generate(text=text, voice=voice_id)
            play(audio)
            with open(output_file_path, "wb") as f:
                f.write(audio)
            return {"status": "success", "message": "Audio generated successfully.", "output_file": output_file_path}
        else:
            print("No ElevenLabs API key. Text-to-speech will not be performed.")
            return {"status": "error", "message": "ELEVENLABS_API_KEY not provided."}

if __name__ == "__main__":
    # This block allows the script to be run directly for testing or via stdin for integration
    if not sys.stdin.isatty():
        # Read JSON input from stdin
        try:
            input_data = json.loads(sys.stdin.read())
            action = input_data.get("action")
            params = input_data.get("params", {})

            service = TextToSpeechService(api_key=params.get("api_key"))

            if action == "convert_text":
                text_to_convert = params.get("text")
                output_file = params.get("output_file_path", "output.mp3")
                voice_id = params.get("voice_id", "default")

                if text_to_convert:
                    try:
                        result = service.convert_text_to_speech(text_to_convert, output_file, voice_id)
                        print(json.dumps(result))
                    except Exception as e:
                        print(json.dumps({"status": "error", "message": f"Text-to-speech conversion failed: {str(e)}"}))
                else:
                    print(json.dumps({"status": "error", "message": "'text' parameter is required for 'convert_text' action."}))
            else:
                print(json.dumps({"status": "error", "message": f"Unknown action: {action}"}))

        except json.JSONDecodeError:
            print(json.dumps({"status": "error", "message": "Invalid JSON input."}))
        except Exception as e:
            print(json.dumps({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}))
    else:
        # Example usage for direct script execution (for development/testing)
        print("Running TextToSpeechService examples (dry run):")

        # Example 1: Basic text to speech
        print("\n--- Basic Text-to-Speech Example ---")
        tts_service = TextToSpeechService(api_key="YOUR_ELEVENLABS_API_KEY") # Replace with your actual API key or set env var
        output_file_1 = "hello_samantha.mp3"
        try:
            result_1 = tts_service.convert_text_to_speech("Hello Samantha, how can I help you today?", output_file_1)
            print(f"Result: {result_1}")
        except Exception as e:
            print(f"Error during text-to-speech: {e}")
        finally:
            if os.path.exists(output_file_1):
                os.remove(output_file_1)

        # Example 2: Different voice ID
        print("\n--- Different Voice ID Example ---")
        output_file_2 = "samantha_response.mp3"
        try:
            result_2 = tts_service.convert_text_to_speech("I am processing your request now.", output_file_2, voice_id="some_other_voice_id")
            print(f"Result: {result_2}")
        except Exception as e:
            print(f"Error during text-to-speech with different voice: {e}")
        finally:
            if os.path.exists(output_file_2):
                os.remove(output_file_2)

        print("\nTextToSpeechService examples finished.")