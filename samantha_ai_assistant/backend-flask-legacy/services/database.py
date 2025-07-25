"""
Database service for Samantha AI Assistant
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from typing import List, Optional
from datetime import datetime

from ..models.command import Command
from ..models.user import User

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.connection_params = {
            'host': os.getenv('DATABASE_HOST'),
            'database': os.getenv('DATABASE_NAME'),
            'user': os.getenv('DATABASE_USER'),
            'password': os.getenv('DATABASE_PASSWORD'),
            'port': os.getenv('DATABASE_PORT', 5432)
        }

    def get_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.connection_params)

    def init_database(self):
        """Initialize database tables"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            # Create command_history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS command_history (
                    id SERIAL PRIMARY KEY,
                    client_id VARCHAR(255) NOT NULL,
                    transcription TEXT NOT NULL,
                    response TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    client_id VARCHAR(255) UNIQUE NOT NULL,
                    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    room VARCHAR(255),
                    user_agent TEXT,
                    command_count INTEGER DEFAULT 0
                )
            """)

            # Create indexes for better performance
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_command_history_client_id
                ON command_history(client_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_command_history_timestamp
                ON command_history(timestamp)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_users_client_id
                ON users(client_id)
            """)

            conn.commit()
            cursor.close()
            conn.close()

            logger.info("Database initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise

    def store_command(self, client_id: str, transcription: str, response: str) -> bool:
        """Store a command in the database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO command_history (client_id, transcription, response, timestamp)
                VALUES (%s, %s, %s, %s)
            """, (client_id, transcription, response, datetime.now()))

            # Update user command count
            cursor.execute("""
                UPDATE users
                SET command_count = command_count + 1, last_activity = %s
                WHERE client_id = %s
            """, (datetime.now(), client_id))

            conn.commit()
            cursor.close()
            conn.close()

            return True

        except Exception as e:
            logger.error(f"Error storing command: {str(e)}")
            return False

    def get_command_history(self, client_id: str, limit: int = 50) -> List[Command]:
        """Get command history for a client"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            cursor.execute("""
                SELECT * FROM command_history
                WHERE client_id = %s
                ORDER BY timestamp DESC
                LIMIT %s
            """, (client_id, limit))

            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            commands = []
            for row in rows:
                command = Command(
                    command_id=row['id'],
                    client_id=row['client_id'],
                    transcription=row['transcription'],
                    response=row['response'],
                    timestamp=row['timestamp']
                )
                commands.append(command)

            return commands

        except Exception as e:
            logger.error(f"Error fetching command history: {str(e)}")
            return []

    def search_commands(self, query: str, client_id: Optional[str] = None) -> List[Command]:
        """Search commands by text"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            if client_id:
                cursor.execute("""
                    SELECT * FROM command_history
                    WHERE client_id = %s AND (
                        transcription ILIKE %s OR response ILIKE %s
                    )
                    ORDER BY timestamp DESC
                    LIMIT 100
                """, (client_id, f'%{query}%', f'%{query}%'))
            else:
                cursor.execute("""
                    SELECT * FROM command_history
                    WHERE transcription ILIKE %s OR response ILIKE %s
                    ORDER BY timestamp DESC
                    LIMIT 100
                """, (f'%{query}%', f'%{query}%'))

            rows = cursor.fetchall()
            cursor.close()
            conn.close()

            commands = []
            for row in rows:
                command = Command(
                    command_id=row['id'],
                    client_id=row['client_id'],
                    transcription=row['transcription'],
                    response=row['response'],
                    timestamp=row['timestamp']
                )
                commands.append(command)

            return commands

        except Exception as e:
            logger.error(f"Error searching commands: {str(e)}")
            return []

    def delete_command(self, command_id: int) -> bool:
        """Delete a command"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("DELETE FROM command_history WHERE id = %s", (command_id,))
            deleted = cursor.rowcount > 0

            conn.commit()
            cursor.close()
            conn.close()

            return deleted

        except Exception as e:
            logger.error(f"Error deleting command: {str(e)}")
            return False

    def get_total_commands_count(self) -> int:
        """Get total number of commands processed"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM command_history")
            count = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            return count

        except Exception as e:
            logger.error(f"Error getting command count: {str(e)}")
            return 0

    def get_client_command_count(self, client_id: str) -> int:
        """Get command count for a specific client"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute(
                "SELECT COUNT(*) FROM command_history WHERE client_id = %s",
                (client_id,)
            )
            count = cursor.fetchone()[0]

            cursor.close()
            conn.close()

            return count

        except Exception as e:
            logger.error(f"Error getting client command count: {str(e)}")
            return 0

    def store_user(self, user: User) -> bool:
        """Store or update user information"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO users (client_id, connected_at, room, user_agent)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (client_id) DO UPDATE SET
                    last_activity = %s,
                    room = %s,
                    user_agent = %s
            """, (
                user.client_id,
                user.connected_at,
                user.room,
                user.user_agent,
                user.last_activity,
                user.room,
                user.user_agent
            ))

            conn.commit()
            cursor.close()
            conn.close()

            return True

        except Exception as e:
            logger.error(f"Error storing user: {str(e)}")
            return False

    def get_user(self, client_id: str) -> Optional[User]:
        """Get user by client ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            cursor.execute("SELECT * FROM users WHERE client_id = %s", (client_id,))
            row = cursor.fetchone()

            cursor.close()
            conn.close()

            if row:
                return User(
                    client_id=row['client_id'],
                    connected_at=row['connected_at'],
                    room=row['room'],
                    user_agent=row['user_agent']
                )

            return None

        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None

    def update_user_activity(self, client_id: str) -> bool:
        """Update user's last activity"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE users
                SET last_activity = %s
                WHERE client_id = %s
            """, (datetime.now(), client_id))

            conn.commit()
            cursor.close()
            conn.close()

            return True

        except Exception as e:
            logger.error(f"Error updating user activity: {str(e)}")
            return False
