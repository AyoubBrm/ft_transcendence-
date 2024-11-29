import django
django.setup()
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django.utils.html import strip_tags
import redis
from .models import Client
from friends.models import Profile
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
import os

online_users: list = []

@database_sync_to_async
def get_user_from_token(token):
    jwt = JWTAuthentication()
    validated_token = jwt.get_validated_token(token)
    _user = jwt.get_user(validated_token)
    return _user

class ChatConsumer(AsyncWebsocketConsumer):
    min_num = None
    client = Client.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    redis_client = None
    async def trough_channel(self, channel_name, text_data):
        channel_layer = get_channel_layer()
        await channel_layer.send(channel_name, { 
                "type": "send.message",
                "text": text_data["message"],
                "user": text_data["sender"],
            })
        
    @database_sync_to_async
    def Backup_message_or_send(self, text_data, my_client : Client): # backup message if ther user offline and send message if the user online 
        redis_client = (redis.Redis)(host=os.getenv('REDIS_HOST'), port=int(os.getenv('REDIS_PORT')), db=1)
        text_data["sender"] = self.scope["user"].username
        if my_client != None:
            if my_client.status == "offline":
                resiver = text_data["user"]
                index = (redis_client.incr)('index') # generate index on redis
                (redis_client.hset)(f'{resiver}:{index}' , mapping=text_data)
            else:
                return "send"

    @database_sync_to_async
    def Creat_client(self):
        self.redis_client = (redis.Redis)(host=os.getenv('REDIS_HOST'), port=int(os.getenv('REDIS_PORT')), db=1)
        data = (self.redis_client.keys)("*")
        user = []
        for i in range(len(data)):
            user.append(data[i].decode('utf-8'))
        if (self.client.filter(username=self.scope["user"].username).exists)(): # if user is alredy have a client model will delete it and creat new channel with online status 
            (self.client.filter(username=self.scope["user"].username).delete)()
            (self.client.create)(username=self.scope["user"].username,\
                channel_name=self.channel_name, status="online")
        else:
            (self.client.create)(username=self.scope["user"].username,
                    channel_name=self.channel_name, status="online")
        return user
    
    @database_sync_to_async
    def Parse_messgae_on_redis(self, key):
        user : str = key[0: key.find(":")] # see if the use have a backup message in redis server and parsing it 
        if self.scope["user"].username == user:
            data = self.redis_client.hgetall(key)
            data = list(data.items())
            data = [[item.decode('utf-8') for item in sublist] for sublist in data]
            data = {key: value for key, value in data}
            json_string = json.dumps(data)
            json_string = json.loads(json_string)
            self.redis_client.delete(key)
            return json_string
            
    async def connect(self):
        try:
            num = []
            cookies =  self.scope['cookies']
            _user = await get_user_from_token(cookies['access'])
            self.scope["user"] = _user
            user = await self.Creat_client()
            for key in user:
                len_key = await sync_to_async (len)(key)
                num.append(key[key.find(":") + 1 : len_key])
            len_num = await sync_to_async (len)(num)
            while len_num > 1:
                len_num = await sync_to_async (len)(num)
                for key in user:
                    self.min_num = await sync_to_async(min)(num)
                    len_key = await sync_to_async (len)(key)
                    if key[key.find(":") + 1 : len_key] == self.min_num:
                        json_string = await self.Parse_messgae_on_redis(key)
                        if json_string != None:
                            await self.trough_channel(self.channel_name, json_string)
                        num.remove(self.min_num)
                        break
        except Exception:
            await self.close(code=1008)
        await self.accept()
        if (self.scope["user"].username not in [user.scope["user"].username for user in online_users]):
            await sync_to_async (online_users.append)(self)
        await self.broadcast_online_users()

        
    async def broadcast_online_users(self):
        for user in online_users:
            await user.send(json.dumps({
                'type': 'broadcast',
                'broadcast': f"{self.scope['user'].username} is online",
                'users': [user.scope['user'].username for user in online_users],
            }))

    async def receive(self, text_data):
        text_data = await sync_to_async(json.loads)(text_data)
        print ("text_data : ", text_data)
        if text_data["type"] == "game_invite":
            print ("username : ", self.scope["user"].username) 
            for user in online_users:
                if user.scope["user"].username == text_data["to"]:
                    await user.send(json.dumps({
                        'type': 'game_invite',
                        'from': text_data["from"],
                    }))
            return
        elif text_data["type"] == "reject_game_invite":
            for user in online_users:
                if user.scope["user"].username == text_data["to"]:
                    await user.send(json.dumps({
                        'type': 'reject_game_invite',
                        'from': text_data["from"],
                    }))
            return 
        elif text_data["type"] == "accept_game_invite":
            for user in online_users:
                if user.scope["user"].username == text_data["to"]:
                    await user.send(json.dumps({
                        'type': 'accept_game_invite',
                        'from': text_data["from"],
                    }))
            pass
        try:
            my_client : Client = await sync_to_async(self.client.get)(username=text_data["user"])
        except Exception:
            return None
        status : str = await self.Backup_message_or_send(text_data, my_client)
        if status == "send":
            await self.trough_channel(my_client.channel_name, text_data)

    # @database_sync_to_async
    async def disconnect(self, event):
        try:
            for user in online_users:
                await user.send(json.dumps({
                    'type': 'remove_user',
                    'broadcast': f"{self.scope['user'].username} is offline",
                    'user': self.scope['user'].username,
                }))
                if user.scope["user"].username == self.scope["user"].username:
                    online_users.remove(user)
        except Exception as e:
            print ("error : ", e)
            pass
        try:
            my_client = await sync_to_async(self.client.get)(username=self.scope["user"].username)
            my_client.update_status("offline")
            await sync_to_async(my_client.save)()
        except Exception:
            return None


    async def send_message(self, event):
        await self.send(json.dumps({
            'type': 'send_message',
            'message': (event["text"]),
            'user': (event["user"]),
        }))