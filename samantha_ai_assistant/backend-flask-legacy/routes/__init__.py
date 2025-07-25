"""
Routes package for Samantha AI Assistant
"""

from .api import api_bp
from .websocket import register_websocket_handlers

__all__ = ['api_bp', 'register_websocket_handlers']
