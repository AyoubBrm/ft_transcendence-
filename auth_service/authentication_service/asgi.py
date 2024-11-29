"""
ASGI config for authentication_service project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'authentication_service.settings')


application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP protocol handling
    "websocket": AuthMiddlewareStack(  # WebSocket protocol handling
        URLRouter(
            websocket_urlpatterns  # Import the WebSocket routes from routing.py
        )
    ),
})