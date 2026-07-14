from rest_framework.permissions import IsAuthenticated
from .models import InventoryRecord
from .serializers import InventoryRecordSerializer
from seaweed_system.api_cache import CachedDetailAPIView, CachedListCreateAPIView


class InventoryRecordListCreateView(CachedListCreateAPIView):
    queryset = InventoryRecord.objects.all()
    serializer_class = InventoryRecordSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:inventory:list"


class InventoryRecordDetailView(CachedDetailAPIView):
    queryset = InventoryRecord.objects.all()
    serializer_class = InventoryRecordSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:inventory:list"
