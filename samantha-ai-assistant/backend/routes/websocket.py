"""
WebSocket event handlers for Samantha AI Assistant
"""

from flask_socketio import emit, join_room, leave_room
from flask import request
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def register_websocket_handlers(socketio):
    """Register all WebSocket event handlers"""

    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        client_id = request.sid

        # Import here to avoid circular imports
        from ..services.connection_manager import ConnectionManager

        connection_manager = ConnectionManager()
        connection_manager.add_client(client_id)

        logger.info(f"Client {client_id} connected")
        emit('connected', {
            'client_id': client_id,
            'message': 'Connected to Samantha AI',
            'timestamp': datetime.now().isoformat()
        })

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        client_id = request.sid

        from ..services.connection_manager import ConnectionManager

        connection_manager = ConnectionManager()
        connection_manager.remove_client(client_id)

        logger.info(f"Client {client_id} disconnected")

    @socketio.on('join_room')
    def handle_join_room(data):
        """Handle client joining a room"""
        client_id = request.sid
        room = data.get('room', 'default')

        join_room(room)

        from ..services.connection_manager import ConnectionManager

        connection_manager = ConnectionManager()
        connection_manager.update_client_room(client_id, room)

        logger.info(f"Client {client_id} joined room {room}")
        emit('room_joined', {
            'room': room,
            'timestamp': datetime.now().isoformat()
        }, room=request.sid)

    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Handle client leaving a room"""
        client_id = request.sid
        room = data.get('room', 'default')

        leave_room(room)

        from ..services.connection_manager import ConnectionManager

        connection_manager = ConnectionManager()
        connection_manager.update_client_room(client_id, None)

        logger.info(f"Client {client_id} left room {room}")
        emit('room_left', {
            'room': room,
            'timestamp': datetime.now().isoformat()
        }, room=request.sid)

    @socketio.on('voice_command')
    def handle_voice_command(data):
        """Handle voice command from client"""
        try:
            client_id = request.sid
            audio_data = data.get('audio')

            if not audio_data:
                emit('error', {
                    'message': 'No audio data provided',
                    'timestamp': datetime.now().isoformat()
                })
                return

            # Import services
            from ..services.voice_processor import VoiceProcessor
            from ..services.ai_processor import AIProcessor
            from ..services.database import DatabaseService
            from ..services.connection_manager import ConnectionManager

            # Process the voice command
            voice_processor = VoiceProcessor()
            ai_processor = AIProcessor()
            db_service = DatabaseService()
            connection_manager = ConnectionManager()

            # Transcribe audio
            transcription = voice_processor.transcribe_audio(audio_data)

            if transcription:
                # Process with AI
                response = ai_processor.process_command(transcription)

                # Store in database
                db_service.store_command(client_id, transcription, response)

                # Update client activity
                connection_manager.update_client_activity(client_id)

                # Send response back to client
                emit('command_response', {
                    'transcription': transcription,
                    'response': response,
                    'timestamp': datetime.now().isoformat(),
                    'client_id': client_id
                })

                logger.info(f"Processed voice command for client {client_id}")
            else:
                emit('error', {
                    'message': 'Could not transcribe audio',
                    'timestamp': datetime.now().isoformat()
                })

        except Exception as e:
            logger.error(f"Error processing voice command: {str(e)}")
            emit('error', {
                'message': 'Error processing voice command',
                'timestamp': datetime.now().isoformat()
            })

    @socketio.on('text_command')
    def handle_text_command(data):
        """Handle text command from client"""
        try:
            client_id = request.sid
            text = data.get('text', '').strip()

            if not text:
                emit('error', {
                    'message': 'No text provided',
                    'timestamp': datetime.now().isoformat()
                })
                return

            # Import services
            from ..services.ai_processor import AIProcessor
            from ..services.database import DatabaseService
            from ..services.connection_manager import ConnectionManager

            ai_processor = AIProcessor()
            db_service = DatabaseService()
            connection_manager = ConnectionManager()

            # Process with AI
            response = ai_processor.process_command(text)

            # Store in database
            db_service.store_command(client_id, text, response)

            # Update client activity
            connection_manager.update_client_activity(client_id)

            # Send response back to client
            emit('command_response', {
                'transcription': text,
                'response': response,
                'timestamp': datetime.now().isoformat(),
                'client_id': client_id,
                'type': 'text'
            })

            logger.info(f"Processed text command for client {client_id}")

        except Exception as e:
            logger.error(f"Error processing text command: {str(e)}")
            emit('error', {
                'message': 'Error processing text command',
                'timestamp': datetime.now().isoformat()
            })

    @socketio.on('ping')
    def handle_ping():
        """Handle ping from client"""
        client_id = request.sid

        from ..services.connection_manager import ConnectionManager

        connection_manager = ConnectionManager()
        connection_manager.update_client_activity(client_id)

        emit('pong', {
            'timestamp': datetime.now().isoformat()
        })

    @socketio.on('get_status')
    def handle_get_status():
        """Handle status request from client"""
        client_id = request.sid

        from ..services.connection_manager import ConnectionManager
        from ..services.database import DatabaseService

        connection_manager = ConnectionManager()
        db_service = DatabaseService()

        client = connection_manager.get_client(client_id)
        command_count = db_service.get_client_command_count(client_id)

        emit('status_response', {
            'client_id': client_id,
            'connected_at': client.connected_at.isoformat() if client else None,
            'command_count': command_count,
            'timestamp': datetime.now().isoformat()
        })
