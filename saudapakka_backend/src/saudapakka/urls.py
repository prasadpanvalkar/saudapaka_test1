from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from apps.properties.views_admin import AdminPropertyViewSet
from apps.users.views_admin import AdminUserViewSet

admin_router = DefaultRouter()
admin_router.register(r'properties', AdminPropertyViewSet, basename='admin-properties')
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.properties.urls')), # <-- UNCOMMENT THIS NOW
    path('api/admin-panel/', include('apps.admin_panel.urls')), 
    path('api/', include('apps.mandates.urls')),

    path('api/admin-panel/', include(admin_router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)