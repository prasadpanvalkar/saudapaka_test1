from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MandateViewSet

router = DefaultRouter()
router.register(r'mandates', MandateViewSet, basename='mandate')

urlpatterns = [
    path('', include(router.urls)),
]