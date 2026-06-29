from django.contrib import admin
from .models import Farmer  # Leta model yako hapa

# Sajili model yako hapa
admin.site.register(Farmer)

from django.contrib import admin
# Badilisha 'InventoryItem' kuwa jina halisi la model yako
from .models import InventoryItem 

admin.site.register(InventoryItem)

from django.contrib import admin
# Badilisha 'MarketProduct' au 'Price' kuwa jina la model yako
from .models import MarketProduct 

admin.site.register(MarketProduct)

from django.contrib import admin
# Badilisha 'SeaweedProduction' kuwa jina la model yako
from .models import SeaweedProduction 

admin.site.register(SeaweedProduction)

from django.contrib import admin
# Badilisha 'Report' kuwa jina la model yako
from .models import Report 

admin.site.register(Report)