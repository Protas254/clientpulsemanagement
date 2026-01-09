import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, ChatMessage, User

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tenant_id = self.scope['url_route']['kwargs']['tenant_id']
        self.room_group_name = f'dashboard_{self.tenant_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from room group
    async def dashboard_update(self, event):
        message = event['message']
        # type = event['type'] # 'dashboard_update'

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'chat_{self.session_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get('message')
            sender_id = data.get('sender_id')

            if not message or not sender_id:
                return

            # Broadcast to room group immediately for responsiveness
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': sender_id
                }
            )

            # Save message to database
            await self.save_message(self.session_id, sender_id, message)
        except Exception as e:
            print(f"Error in chat receive: {e}")

    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id
        }))

    @database_sync_to_async
    def save_message(self, session_id, sender_id, message):
        try:
            session = ChatSession.objects.get(id=session_id)
            # Find the user - can be from any role (customer or tenant staff)
            sender = User.objects.get(id=sender_id)
            
            ChatMessage.objects.create(
                session=session, 
                sender=sender, 
                content=message
            )
            
            # Update session timestamp for sorting
            session.save() # This triggers auto_now=True for updated_at
        except Exception as e:
            print(f"Error saving chat message: {e}")
