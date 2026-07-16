from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
<<<<<<< HEAD
    path('api/', include('farmers.urls')),
    path('api/production/', include('production.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/market/', include('market.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
=======
    
    # Njia ya kupata Token wakati wa Login (Hii itatatua kosa la 404!)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Njia zako za farmers API
    path('api/farmers/', include('farmers.urls')), 
]
>>>>>>> 36422b4 (Initial commit for main branch)
