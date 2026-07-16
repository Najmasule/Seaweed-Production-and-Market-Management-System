from django.db import models

class SeaweedProduction(models.Model):
    # null=True na blank=True inazuia Django kuuliza default value kwenye terminal
    farmer_id = models.IntegerField(null=True, blank=True, help_text="ID ya Mkulima kutoka microservice ya Farmers")
    date = models.DateField()
    quantity = models.FloatField(default=0.0)
    type = models.CharField(max_length=50, default="Unknown")

<<<<<<< HEAD
=======
    class Meta:
        verbose_name = "Seaweed Production"
        verbose_name_plural = "Seaweed Production"  # Inazuia neno "Productions" lisilo rasmi

>>>>>>> 36422b4 (Initial commit for main branch)
    def __str__(self):
        return f"Farmer ID: {self.farmer_id} - {self.date} - {self.type}"