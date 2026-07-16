from django.urls import path
from .views import TraderRegisterView, TraderProfileView, OrderListCreateView, TraderListView # Hakikisha ume-import hii

urlpatterns = [
    # Hii line hapa chini ndio itakayomaliza hili kosa la 404 kwenye logi zako!
    path('', TraderListView.as_view(), name='trader-list'),
    
    path('register/', TraderRegisterView.as_view(), name='trader-register'),
    path('profile/', TraderProfileView.as_view(), name='trader-profile'),
    path('orders/', OrderListCreateView.as_view(), name='trader-orders'),
]