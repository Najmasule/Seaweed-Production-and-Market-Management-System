from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class Farmer(AbstractUser):
    ROLE_CHOICES = (
        ("farmer", "Farmer"),
        ("trader", "Trader"),
    )

    location = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="farmer")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Farmer"
        verbose_name_plural = "Farmers"

    def __str__(self):
        return self.username


class Production(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="farmers_productions")
    date = models.DateField()
    quantity = models.FloatField()
    type = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.farmer.username} - {self.date}"


class MarketPrices(models.Model):
    date = models.DateField()
    product_type = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    demand_level = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.product_type} - {self.price}"


class Inventory(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="farmers_inventories")
    stock_level = models.FloatField()
    date_updated = models.DateField(auto_now=True)

    class Meta:
        verbose_name = "Inventory"
        verbose_name_plural = "Inventory"

    def __str__(self):
        return f"{self.farmer.username} - {self.stock_level}"


class Reports(models.Model):
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="farmers_reports")
    production_summary = models.TextField()
    market_summary = models.TextField()
    date_generated = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = "Report"
        verbose_name_plural = "Report"

    def __str__(self):
        return f"Report for {self.farmer.username} - {self.date_generated}"