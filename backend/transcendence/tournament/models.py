from django.db import models
import requests

class Tournament(models.Model):
    winner_id = models.IntegerField(null=True)
    
    player_a_id = models.IntegerField(null=True)
    player_b_id = models.IntegerField(null=True)
    player_c_id = models.IntegerField(null=True)
    player_d_id = models.IntegerField(null=True)
    
    winner_one = models.CharField(max_length=20, null=True)
    winner_two = models.CharField(max_length=20, null=True)
    
    # score_a = models.IntegerField(null=True)
    # score_b = models.IntegerField(null=True)
    # score_c = models.IntegerField(null=True)
    # score_d = models.IntegerField(null=True)
    
    status = models.CharField(max_length=20, default='In progress', null=True)
    date = models.DateTimeField(auto_now_add=True)
    
    def get_winner(self):
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.winner_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None
    
    def get_player_a(self):
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.player_a_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None

    def get_player_b(self):
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.player_b_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None

    def get_player_c(self):
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.player_c_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None

    def get_player_d(self):
        response = requests.get(f'http://auth:3000/api/auth/user/id/{self.player_d_id}/')
        if response.status_code == 200:
            return response.json()
        else:
            return None
        
