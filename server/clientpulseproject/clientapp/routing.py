from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/dashboard/(?P<tenant_id>[0-9a-f-]+)/$', consumers.DashboardConsumer.as_asgi()),
    re_path(r'ws/super-admin/$', consumers.SuperAdminConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<session_id>[0-9a-f-]+)/$', consumers.ChatConsumer.as_asgi()),
]
