from rest_framework.permissions import IsAuthenticated
from .models import SeaweedProduction
from .serializers import SeaweedProductionSerializer
from seaweed_system.api_cache import CachedDetailAPIView, CachedListCreateAPIView


class SeaweedProductionListCreateView(CachedListCreateAPIView):
    queryset = SeaweedProduction.objects.all()
    serializer_class = SeaweedProductionSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:production:list"


class SeaweedProductionDetailView(CachedDetailAPIView):
    queryset = SeaweedProduction.objects.all()
    serializer_class = SeaweedProductionSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:production:list"
