from django.db import models

class SeaweedProduction(models.Model):
    # null=True na blank=True inazuia Django kuuliza default value kwenye terminal
    farmer_id = models.IntegerField(null=True, blank=True, help_text="ID ya Mkulima kutoka microservice ya Farmers")
    date = models.DateField()
    quantity = models.FloatField(default=0.0)
    type = models.CharField(max_length=50, default="Unknown")

    def __str__(self):
        return f"Farmer ID: {self.farmer_id} - {self.date} - {self.type}"