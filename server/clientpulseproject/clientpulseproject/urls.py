from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Customize admin site
admin.site.site_header = "ClientPulse Administration"
admin.site.site_title = "ClientPulse Admin Portal"
admin.site.index_title = "Welcome to ClientPulse Platform Admin"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('clientapp.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
