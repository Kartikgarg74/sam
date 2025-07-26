"""
Command model for storing voice command history
"""

from datetime import datetime
from typing import Optional, Dict, Any

class Command:
    def __init__(self, client_id: str, transcription: str, response: str,
                 command_id: Optional[int] = None, timestamp: Optional[datetime] = None):
        self.id = command_id
        self.client_id = client_id
        self.transcription = transcription
        self.response = response
        self.timestamp = timestamp or datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """Convert command to dictionary"""
        return {
            'id': self.id,
            'client_id': self.client_id,
            'transcription': self.transcription,
            'response': self.response,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Command':
        """Create command from dictionary"""
        return cls(
            command_id=data.get('id'),
            client_id=data['client_id'],
            transcription=data['transcription'],
            response=data['response'],
            timestamp=datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else None
        )

    def __repr__(self):
        return f"<Command(id={self.id}, client_id='{self.client_id}', timestamp='{self.timestamp}')>"
