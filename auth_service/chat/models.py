from django.db import models

# Create your models here.
class Client(models.Model):
    username = models.CharField(max_length=200, unique=True)
    channel_name = models.CharField(max_length=200 ,unique=True)
    status = models.CharField(max_length=7, blank=False)

    def get_channel_name(self):
        return  self.channel_name
    
    def update_status(self, status):
        self.status = status