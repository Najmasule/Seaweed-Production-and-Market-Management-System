from django.contrib import admin
<<<<<<< HEAD
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/farmers/', include('farmers.urls')),
=======
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Tunaiimport ile view yetu kutoka kwenye farmers.views
from farmers.views import current_user

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- Microservices Endpoints ---
    path('api/farmers/', include('farmers.urls')),
    path('api/traders/', include('traders.urls')),  
>>>>>>> 36422b4 (Initial commit for main branch)
    path('api/production/', include('production.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/market/', include('market.urls')),
    path('api/reports/', include('reports.urls')),
<<<<<<< HEAD
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
=======
    
    # --- API Auth Me Endpoint (Hii ndiyo inayotatua 404 ya /api/auth/me/) ---
    path('api/auth/me/', current_user, name='current-user-api'),
    
    # --- Login na Token Endpoints (Zinazoendana na api.js yako) ---
    path('api/auth/token/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair_api'),
    path('api/auth/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh_api'),
    
    # --- Legacy Endpoints (Kwa usalama wa maeneo mengine ya mradi) ---
    path('api/login/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('api/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
]
>>>>>>> 36422b4 (Initial commit for main branch)
