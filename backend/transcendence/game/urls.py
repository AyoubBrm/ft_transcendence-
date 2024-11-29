from django.urls import path
from .views import (
    select_game,
    UpdateScore,
    initGame,
    CompleteGame,
    GetGame,
    RankUser,
)
urlpatterns = [
    path('', select_game, name='select_game'),
    path('init-game', initGame.as_view(), name='init-game'),
    path('update-score', UpdateScore.as_view(), name='update-score'),
    path('complete-game', CompleteGame.as_view(), name='complete-game'),
    path('get-games', GetGame.as_view(), name='get-game'),
    path('rank/', RankUser.as_view(), name='rank'),
    # path('3d', views.game_3d, name='game_3d'),
    # path('off_2d', views.game_2d_off, name='game_2d_off'),
]
