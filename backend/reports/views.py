from rest_framework.permissions import IsAuthenticated
from .models import Report
from .serializers import ReportSerializer
from seaweed_system.api_cache import CachedDetailAPIView, CachedListCreateAPIView


class ReportListCreateView(CachedListCreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:reports:list"


class ReportDetailView(CachedDetailAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    cache_key = "api:reports:list"
