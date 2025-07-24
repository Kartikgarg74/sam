"""
API routes for Samantha AI Assistant
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

# Create blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

logger = logging.getLogger(__name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Samantha AI Assistant API"
    })

@api_bp.route('/commands/history/<client_id>', methods=['GET'])
def get_command_history(client_id):
    """Get command history for a specific client"""
    try:
        from ..services.database import DatabaseService

        db_service = DatabaseService()
        history = db_service.get_command_history(client_id, limit=50)

        return jsonify({
            'success': True,
            'history': [cmd.to_dict() for cmd in history],
            'count': len(history)
        })

    except Exception as e:
        logger.error(f"Error fetching command history: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Could not fetch command history'
        }), 500

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    try:
        from ..services.database import DatabaseService
        from ..services.connection_manager import ConnectionManager

        db_service = DatabaseService()
        connection_manager = ConnectionManager()

        total_commands = db_service.get_total_commands_count()
        active_connections = connection_manager.get_active_connections_count()

        return jsonify({
            'success': True,
            'stats': {
                'active_connections': active_connections,
                'total_commands_processed': total_commands,
                'uptime': 'Running',
                'timestamp': datetime.now().isoformat()
            }
        })

    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Could not fetch statistics'
        }), 500

@api_bp.route('/commands/search', methods=['POST'])
def search_commands():
    """Search commands by text"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        client_id = data.get('client_id')

        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter is required'
            }), 400

        from ..services.database import DatabaseService

        db_service = DatabaseService()
        results = db_service.search_commands(query, client_id)

        return jsonify({
            'success': True,
            'results': [cmd.to_dict() for cmd in results],
            'count': len(results),
            'query': query
        })

    except Exception as e:
        logger.error(f"Error searching commands: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Could not search commands'
        }), 500

@api_bp.route('/commands/<int:command_id>', methods=['DELETE'])
def delete_command(command_id):
    """Delete a specific command"""
    try:
        from ..services.database import DatabaseService

        db_service = DatabaseService()
        success = db_service.delete_command(command_id)

        if success:
            return jsonify({
                'success': True,
                'message': 'Command deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Command not found'
            }), 404

    except Exception as e:
        logger.error(f"Error deleting command: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Could not delete command'
        }), 500

@api_bp.route('/clients', methods=['GET'])
def get_active_clients():
    """Get list of active clients"""
    try:
        from ..services.connection_manager import ConnectionManager

        connection_manager = ConnectionManager()
        clients = connection_manager.get_all_clients()

        return jsonify({
            'success': True,
            'clients': [client.to_dict() for client in clients],
            'count': len(clients)
        })

    except Exception as e:
        logger.error(f"Error fetching active clients: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Could not fetch active clients'
        }), 500

@api_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@api_bp.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
