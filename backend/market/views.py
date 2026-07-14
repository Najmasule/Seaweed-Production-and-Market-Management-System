from rest_framework.permissions import IsAuthenticated
from .models import MarketPrice
from .serializers import MarketPriceSerializer
from seaweed_system.api_cache import CachedDetailAPIView, CachedListCreateAPIView


class MarketPriceListCreateView(CachedListCreateAPIView):
    queryset = MarketPrice.objects.all()
    serializer_class = MarketPriceSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:market:list"


class MarketPriceDetailView(CachedDetailAPIView):
    queryset = MarketPrice.objects.all()
    serializer_class = MarketPriceSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:market:list"
