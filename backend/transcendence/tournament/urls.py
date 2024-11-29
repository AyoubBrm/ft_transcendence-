from django.urls import path
from .views import (
    initGame,
    UpdateScore,
    CompleteTournament
)
 
 
urlpatterns = [
    path('init-game/', initGame.as_view(), name='init_game'),
    path('update-score/', UpdateScore.as_view(), name='update_score'),
    path('complete-tournament/', CompleteTournament.as_view(), name='complete_tournament'),
]
