import os
import json
import logging
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import openai
import whisper
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import threading
import time
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'samantha-secret-key')

# Enable CORS
CORS(app, origins=["*"])

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Initialize Whisper model
whisper_model = whisper.load_model("base")

# Initialize Redis
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD'),
    decode_responses=True
)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DATABASE_HOST'),
        database=os.getenv('DATABASE_NAME'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASSWORD'),
        port=os.getenv('DATABASE_PORT', 5432)
    )

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store active connections
active_connections = {}

@app.route('/')
def index():
    return jsonify({
        "message": "Samantha AI Assistant Backend",
        "status": "running",
        "version": "1.0.0"
    })

@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "redis": check_redis_connection(),
            "database": check_database_connection(),
            "openai": bool(os.getenv('OPENAI_API_KEY'))
        }
    })

def check_redis_connection():
    try:
        redis_client.ping()
        return True
    except:
        return False

def check_database_connection():
    try:
        conn = get_db_connection()
        conn.close()
        return True
    except:
        return False

@socketio.on('connect')
def handle_connect():
    client_id = request.sid
    active_connections[client_id] = {
        'connected_at': datetime.now().isoformat(),
        'room': None
    }
    logger.info(f"Client {client_id} connected")
    emit('connected', {'client_id': client_id, 'message': 'Connected to Samantha AI'})

@socketio.on('disconnect')
def handle_disconnect():
    client_id = request.sid
    if client_id in active_connections:
        del active_connections[client_id]
    logger.info(f"Client {client_id} disconnected")

@socketio.on('join_room')
def handle_join_room(data):
    client_id = request.sid
    room = data.get('room', 'default')
    join_room(room)
    active_connections[client_id]['room'] = room
    logger.info(f"Client {client_id} joined room {room}")
    emit('room_joined', {'room': room}, room=request.sid)

@socketio.on('voice_command')
def handle_voice_command(data):
    try:
        client_id = request.sid
        audio_data = data.get('audio')

        if not audio_data:
            emit('error', {'message': 'No audio data provided'})
            return

        # Process audio with Whisper
        # Note: In production, you'd handle audio file processing here
        transcription = process_audio_transcription(audio_data)

        if transcription:
            # Process command with GPT-4
            response = process_ai_command(transcription)

            # Store command in database
            store_command_history(client_id, transcription, response)

            # Send response back to client
            emit('command_response', {
                'transcription': transcription,
                'response': response,
                'timestamp': datetime.now().isoformat()
            })
        else:
            emit('error', {'message': 'Could not transcribe audio'})

    except Exception as e:
        logger.error(f"Error processing voice command: {str(e)}")
        emit('error', {'message': 'Error processing voice command'})

def process_audio_transcription(audio_data):
    """Process audio data and return transcription"""
    try:
        # In a real implementation, you'd save the audio data to a temporary file
        # and then process it with Whisper
        # For now, we'll simulate this

        # Placeholder for actual audio processing
        # result = whisper_model.transcribe(audio_file_path)
        # return result["text"]

        # Simulated response for development
        return "Hello Samantha, please help me with my computer"

    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        return None

def process_ai_command(transcription):
    """Process transcribed command with GPT-4"""
    try:
        system_prompt = """
        You are Samantha, an AI assistant that can help control computers remotely through voice commands.
        You can help with:
        - Opening applications
        - File management
        - System information
        - Web browsing
        - Basic automation tasks

        Respond in a helpful, friendly manner and provide clear instructions.
        """

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcription}
            ],
            max_tokens=500,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Error processing AI command: {str(e)}")
        return "I'm sorry, I couldn't process that command right now."

def store_command_history(client_id, transcription, response):
    """Store command history in database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO command_history (client_id, transcription, response, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (client_id, transcription, response, datetime.now()))

        conn.commit()
        cursor.close()
        conn.close()

    except Exception as e:
        logger.error(f"Error storing command history: {str(e)}")

@app.route('/api/commands/history/<client_id>')
def get_command_history(client_id):
    """Get command history for a client"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT * FROM command_history
            WHERE client_id = %s
            ORDER BY timestamp DESC
            LIMIT 50
        """, (client_id,))

        history = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({'history': history})

    except Exception as e:
        logger.error(f"Error fetching command history: {str(e)}")
        return jsonify({'error': 'Could not fetch command history'}), 500

@app.route('/api/stats')
def get_stats():
    """Get system statistics"""
    return jsonify({
        'active_connections': len(active_connections),
        'uptime': 'Running',
        'total_commands_processed': get_total_commands_count()
    })

def get_total_commands_count():
    """Get total number of commands processed"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM command_history")
        count = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return count

    except Exception as e:
        logger.error(f"Error getting command count: {str(e)}")
        return 0

if __name__ == '__main__':
    # Initialize database tables if they don't exist
    init_database()

    # Run the application
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)

def init_database():
    """Initialize database tables"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS command_history (
                id SERIAL PRIMARY KEY,
                client_id VARCHAR(255) NOT NULL,
                transcription TEXT NOT NULL,
                response TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        cursor.close()
        conn.close()

        logger.info("Database initialized successfully")

    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
