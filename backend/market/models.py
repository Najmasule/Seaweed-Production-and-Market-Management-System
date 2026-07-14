from django.db import models


class MarketPrice(models.Model):
    PRODUCT_TYPE_CHOICES = (
        ("eucheuma", "Eucheuma"),
        ("spinosum", "Spinosum"),
        ("cotoni", "Cotoni"),
    )
    DEMAND_LEVEL_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    )

    product_type = models.CharField(max_length=50, choices=PRODUCT_TYPE_CHOICES, default="eucheuma")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    demand_level = models.CharField(max_length=20, choices=DEMAND_LEVEL_CHOICES, default="medium")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Market Price"
        verbose_name_plural = "Market Prices"

    def __str__(self):
        return f"{self.product_type} - {self.price_per_kg}/kg"
