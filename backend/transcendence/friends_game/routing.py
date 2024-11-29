# friends_game/routing.py
from django.urls import re_path
from .consumers import FriendsGameConsumer

websocket_urlpatterns = [
    re_path(r'ws/friends_game/(?P<room_id>\w+)/$', FriendsGameConsumer.as_asgi()),
]
