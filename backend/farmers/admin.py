from django.contrib import admin
<<<<<<< HEAD
from .models import Farmer, Production, MarketPrices, Inventory, Reports

# Register each model so it appears in Admin
@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "location", "phone", "role")
    search_fields = ("username", "email", "phone")

@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ("farmer", "date", "quantity", "type")
    list_filter = ("type", "date")

@admin.register(MarketPrices)
class MarketPricesAdmin(admin.ModelAdmin):
    list_display = ("date", "product_type", "price", "demand_level")
    list_filter = ("product_type", "date")

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("farmer", "stock_level", "date_updated")
    list_filter = ("date_updated",)

@admin.register(Reports)
class ReportsAdmin(admin.ModelAdmin):
    list_display = ("farmer", "production_summary", "market_summary", "date_generated")
    list_filter = ("date_generated",)
=======
from .models import Farmer, Inventory, Production, MarketPrices, Reports

# Kusajili models kwenye Django Admin Panel ili uweze kuziona na kuzihariri kirahisi
@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'phone_number', 'location', 'created_at')
    search_fields = ('username', 'phone_number', 'location')

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'farmer', 'item_name', 'quantity', 'unit', 'updated_at')
    list_filter = ('farmer', 'item_name')

@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ('id', 'farmer', 'seaweed_type', 'quantity_kg', 'harvest_date', 'status', 'created_at')
    list_filter = ('seaweed_type', 'status', 'harvest_date')
    search_fields = ('farmer__username', 'seaweed_type')

@admin.register(MarketPrices)
class MarketPricesAdmin(admin.ModelAdmin):
    list_display = ('id', 'seaweed_type', 'price_per_kg', 'updated_at')

@admin.register(Reports)
class ReportsAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'report_type', 'generated_by', 'created_at')
    list_filter = ('report_type', 'created_at')
>>>>>>> 36422b4 (Initial commit for main branch)
