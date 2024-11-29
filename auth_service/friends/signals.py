from django.dispatch import receiver
from django.db.models.signals import post_save
from .models import friend_request , Profile

@receiver(post_save, sender=friend_request)
def add_frind(sender, instance, created, **kwarg):
    _sender = Profile.objects.get(user=instance.sender)
    _reciver = Profile.objects.get(user=instance.reciver)
    _reciver.waiting.add(instance.sender)
    if instance.status == True:
        _sender.friends.add(instance.reciver)
        _reciver.friends.add(instance.sender)
        _reciver.waiting.remove(instance.sender)
        