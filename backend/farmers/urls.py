<<<<<<< HEAD
from django.urls import path
from .views import FarmerDetailView, FarmerListView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('farmers/', FarmerListView.as_view(), name='farmers'),
    path('farmers/<int:pk>/', FarmerDetailView.as_view(), name='farmer-detail'),
]
=======
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmerViewSet, InventoryViewSet, ProductionViewSet, MarketPricesViewSet, ReportsViewSet

router = DefaultRouter()
router.register(r'list', FarmerViewSet, basename='farmer')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'production', ProductionViewSet, basename='production')
router.register(r'prices', MarketPricesViewSet, basename='marketprices')
router.register(r'reports', ReportsViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]
from django.urls import path
from .views import RegisterView  # Hakikisha ume-import view mpya

urlpatterns = [
    # Njia zako zingine zilizopo...
    path('register/', RegisterView.as_view(), name='auth_register'),
]
>>>>>>> 36422b4 (Initial commit for main branch)
