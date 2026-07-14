from django.core.cache import cache
from rest_framework import generics
from rest_framework.response import Response


class CachedListCreateAPIView(generics.ListCreateAPIView):
    """Caches collection GET responses and clears them after a write."""

    cache_key = None

    def list(self, request, *args, **kwargs):
        data = cache.get(self.cache_key)
        if data is None:
            queryset = self.filter_queryset(self.get_queryset())
            data = self.get_serializer(queryset, many=True).data
            cache.set(self.cache_key, data, timeout=300)
        return Response(data)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete(self.cache_key)


class CachedDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Clears the matching collection cache after an update or deletion."""

    cache_key = None

    def perform_update(self, serializer):
        serializer.save()
        cache.delete(self.cache_key)

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete(self.cache_key)
