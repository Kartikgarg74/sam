from flask import Flask, request, jsonify
from services.ai_service import AIService
import asyncio
import logging

app = Flask(__name__)
ai_service = AIService()

logging.basicConfig(level=logging.INFO)

@app.route('/')
def home():
    return "Samantha AI Backend is running!"

@app.route('/classify_intent', methods=['POST'])
async def classify_intent_route():
    data = request.json
    user_input = data.get('user_input')
    context = data.get('context', {})
    
    if not user_input:
        return jsonify({"error": "user_input is required"}), 400

    try:
        classification_result = await ai_service.classify_intent(user_input, context)
        return jsonify(classification_result)
    except Exception as e:
        logging.error(f"Error in classify_intent_route: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate_response', methods=['POST'])
async def generate_response_route():
    data = request.json
    intent_result = data.get('intent_result')
    execution_result = data.get('execution_result')

    if not intent_result or not execution_result:
        return jsonify({"error": "intent_result and execution_result are required"}), 400

    try:
        response_text = await ai_service.generate_response(intent_result, execution_result)
        return jsonify({"response_text": response_text})
    except Exception as e:
        logging.error(f"Error in generate_response_route: {e}")
        return jsonify({"error": str(e)}), 500

@app.before_first_request
async def initialize_ai_service():
    await ai_service.initialize()

if __name__ == '__main__':
    # For development, use a simple server. For production, use Gunicorn or similar.
    # This part needs to be adapted for async Flask or a proper ASGI server.
    # For now, we'll run it in a way that allows the async initialize to run.
    # A more robust solution would involve a proper ASGI server like uvicorn.
    import threading
    def run_app():
        app.run(debug=True, port=5000, use_reloader=False)
    
    # Run Flask app in a separate thread
    flask_thread = threading.Thread(target=run_app)
    flask_thread.start()

    # Run the async initialization in the main thread's event loop
    asyncio.run(initialize_ai_service())