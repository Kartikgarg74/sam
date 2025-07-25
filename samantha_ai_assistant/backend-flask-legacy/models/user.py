"""
User model for managing client connections
"""

from datetime import datetime
from typing import Optional, Dict, Any

class User:
    def __init__(self, client_id: str, connected_at: Optional[datetime] = None,
                 room: Optional[str] = None, user_agent: Optional[str] = None):
        self.client_id = client_id
        self.connected_at = connected_at or datetime.now()
        self.room = room
        self.user_agent = user_agent
        self.last_activity = datetime.now()
        self.command_count = 0

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.now()

    def increment_command_count(self):
        """Increment command count"""
        self.command_count += 1
        self.update_activity()

    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary"""
        return {
            'client_id': self.client_id,
            'connected_at': self.connected_at.isoformat() if self.connected_at else None,
            'room': self.room,
            'user_agent': self.user_agent,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'command_count': self.command_count
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create user from dictionary"""
        user = cls(
            client_id=data['client_id'],
            connected_at=datetime.fromisoformat(data['connected_at']) if data.get('connected_at') else None,
            room=data.get('room'),
            user_agent=data.get('user_agent')
        )
        user.last_activity = datetime.fromisoformat(data['last_activity']) if data.get('last_activity') else datetime.now()
        user.command_count = data.get('command_count', 0)
        return user

    def __repr__(self):
        return f"<User(client_id='{self.client_id}', connected_at='{self.connected_at}', commands={self.command_count})>"
