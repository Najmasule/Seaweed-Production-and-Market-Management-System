from django.core.cache import cache
from rest_framework import generics
from rest_framework.response import Response


<<<<<<< HEAD
=======
def clear_api_caches():
    """Inafuta cache zote muhimu ili Dashboard na Orodha (List) zote zisome data mpya."""
    # Futa cache ya list ya wakulima
    cache.delete("api:farmers:list")
    
    # Futa cache za dashboard/stats kama zipo
    cache.delete("api:dashboard:stats")
    cache.delete("api:dashboard:summary")
    
    # Kama una cache nyingine zozote ulizoweka kwenye mfumo, zifute hapa
    # mfano: cache.delete("api:traders:list")


>>>>>>> 36422b4 (Initial commit for main branch)
class CachedListCreateAPIView(generics.ListCreateAPIView):
    """Caches collection GET responses and clears them after a write."""

    cache_key = None

    def list(self, request, *args, **kwargs):
<<<<<<< HEAD
        data = cache.get(self.cache_key)
        if data is None:
            queryset = self.filter_queryset(self.get_queryset())
            data = self.get_serializer(queryset, many=True).data
            cache.set(self.cache_key, data, timeout=300)
=======
        # Ili kuzuia search filters zisigande kwenye cache, tunatengeneza key ya kipekee kutokana na URL query params
        query_params = request.query_params.urlencode()
        unique_cache_key = f"{self.cache_key}:{query_params}" if query_params else self.cache_key

        data = cache.get(unique_cache_key)
        if data is None:
            queryset = self.filter_queryset(self.get_queryset())
            data = self.get_serializer(queryset, many=True).data
            cache.set(unique_cache_key, data, timeout=300)
>>>>>>> 36422b4 (Initial commit for main branch)
        return Response(data)

    def perform_create(self, serializer):
        serializer.save()
<<<<<<< HEAD
        cache.delete(self.cache_key)
=======
        # Safisha cache zote ili dashboard na list zote zionyeshe data mpya mara moja!
        clear_api_caches()
>>>>>>> 36422b4 (Initial commit for main branch)


class CachedDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Clears the matching collection cache after an update or deletion."""

    cache_key = None

    def perform_update(self, serializer):
        serializer.save()
<<<<<<< HEAD
        cache.delete(self.cache_key)

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete(self.cache_key)
=======
        # Safisha cache zote baada ya kuhariri (edit)
        clear_api_caches()

    def perform_destroy(self, instance):
        instance.delete()
        # Safisha cache zote baada ya kufuta (delete)
        clear_api_caches()
>>>>>>> 36422b4 (Initial commit for main branch)
