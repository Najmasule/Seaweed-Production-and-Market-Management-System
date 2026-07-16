from rest_framework import generics, permissions, status
from rest_framework.response import Response

# Import ya Model na Serializers kutoka kwenye app yako ya traders
from .models import Trader
from .serializers import TraderSerializer, TraderRegisterSerializer

# ==========================================
# 1. VIEW YA KULIST NA KUSAJILI TRADERS (GET & POST)
# ==========================================
class TraderListView(generics.ListCreateAPIView):
    """
    GET: Inarudisha orodha ya Wafanyabiashara kwa kutumia TraderSerializer (inaonyesha CONTACT vizuri)
    POST: Inasajili Trader mpya kwa kutumia TraderRegisterSerializer
    """
    queryset = Trader.objects.all()
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        # Kama ni POST (usajili), tumia Register Serializer
        if self.request.method == 'POST':
            return TraderRegisterSerializer
        # Kama ni GET (kuorodhesha kwenye table), tumia Serializer ya kawaida
        return TraderSerializer

    def create(self, request, *args, **kwargs):
        # Tengeneza nakala ya data inayokuja kutoka frontend ili tuweze kuibadilisha
        data = request.data.copy()

        # 1. Oanisha jina kutoka kwenye Form kwenda kwenye 'name' inayotakiwa na Serializer
        if 'name' not in data:
            data['name'] = data.get('contact_name') or data.get('Contact Name') or data.get('first_name') or 'Trader New'

        # 2. Oanisha namba ya simu kwenda kwenye 'contact' inayotakiwa na Serializer
        if 'contact' not in data:
            data['contact'] = data.get('phone') or data.get('Phone') or '0000000000'

        # 3. Tengeneza 'username' kutokana na Email kama haipo
        if 'username' not in data or not data['username']:
            email = data.get('email') or data.get('Email')
            if email:
                data['username'] = email.split('@')[0]
            else:
                clean_phone = str(data['contact']).replace(" ", "")
                data['username'] = f"trader_{clean_phone[-4:]}"

        # 4. Weka Password ya majaribio (Default Password)
        if 'password' not in data or not data['password']:
            data['password'] = 'Trader@12345'

        # Sasa ipasasishe data hii mpya iliyonyooka kwenda kwenye serializer
        serializer = self.get_serializer(data=data)
        
        if not serializer.is_valid():
            print("❌ VALIDATION ERRORS TENA:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ==========================================
# 2. VIEW YA USAJILI PEKEE (Kama inatumiwa na endpoint ya Register)
# ==========================================
class TraderRegisterView(generics.CreateAPIView):
    """
    Inashughulikia usajili pekee wa Traders.
    """
    queryset = Trader.objects.all()
    serializer_class = TraderRegisterSerializer
    permission_classes = [permissions.AllowAny]


# ==========================================
# 3. VIEW YA PROFILE YA TRADER (Kuangalia na kurekebisha taarifa)
# ==========================================
class TraderProfileView(generics.RetrieveUpdateAPIView):
    """
    Inashughulikia kuona au kubadilisha taarifa za Trader mmoja mmoja.
    """
    queryset = Trader.objects.all()
    serializer_class = TraderSerializer
    permission_classes = [permissions.AllowAny]


# ==========================================
# 4. VIEW YA ORDERS ZA TRADER (Kama ipo kwenye urls)
# ==========================================
class OrderListCreateView(generics.ListCreateAPIView):
    """
    Placeholder View kwa ajili ya orders ili kuzuia ImportError kwenye URL configuration.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"message": "Order feature endpoint is active!"}, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        return Response({"message": "Order creation endpoint is active!"}, status=status.HTTP_201_CREATED)