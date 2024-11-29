# friends_game/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db import models
import requests

class GameScore(models.Model):
    player_a_id = models.IntegerField(null=True)  # Store user ID instead of User model
    player_b_id = models.IntegerField(null=True)
    score_a = models.IntegerField(null=True)
    score_b = models.IntegerField(null=True)
    status = models.CharField(max_length=20, default='In progress', null=True)
    date = models.DateTimeField(auto_now_add=True)

    # You can create a method to fetch the player info via API if needed:
    def get_player_a(self):
        # Example of fetching player A details using the user ID
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.player_a_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None

    def get_player_b(self):
        # Example of fetching player B details using the user ID
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.player_b_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None