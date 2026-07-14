from django.urls import path
from .views import MarketPriceListCreateView, MarketPriceDetailView

urlpatterns = [
    path("", MarketPriceListCreateView.as_view(), name="market-list-create"),
    path("<int:pk>/", MarketPriceDetailView.as_view(), name="market-detail"),
]
