from django.db import models
# from django.contrib.auth.models import User
from authentication_service.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    friends = models.ManyToManyField(User, blank=True, related_name="friends")
    waiting = models.ManyToManyField(User, blank=True, related_name="waiting")
    block = models.ManyToManyField(User, blank=True, related_name="block")

    def __str__(self):
        return f'{self.user.username} Profile'
    
class friend_request(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sender")
    reciver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reciver")
    status = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.sender.username} request'