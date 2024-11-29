from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Tournament
from game.services import (
    get_user_from_api,
    get_user_from_api_by_id
)

class initGame(APIView):
    def post(self, request):
        print('INIT GAME', request.data)
        users = request.data
        players = []
        for i, user in enumerate(users):
            players.append(get_user_from_api(user))
            
        for player in players:
            print('player ======>', player)
            
        tournament = Tournament.objects.create(
            player_a_id=players[0]['id'],
            player_b_id=players[1]['id'],
            player_c_id=players[2]['id'],
            player_d_id=players[3]['id'],
            winner_one=None,
            winner_two=None,
            status='In progress'
        )
        
        existing_tournament = Tournament.objects.filter(
            player_a_id=players[0]['id'],
            player_b_id=players[1]['id'],
            player_c_id=players[2]['id'],
            player_d_id=players[3]['id'],
            status='In progress'
        ).first()
        
        if existing_tournament:
            print('existing_tournament', existing_tournament.id, existing_tournament.player_a_id, existing_tournament.player_b_id)
            return Response({
                'tournament_id': existing_tournament.id,
                'player_a': players[0]['first_name'],
                'player_b': players[1]['first_name'],
                'player_c': players[2]['first_name'],
                'player_d': players[3]['first_name'],
                'status': 'In progress',
                })
        else:
            print('tournament', tournament.id, tournament.player_a_id, tournament.player_b_id)
            
        return Response({'tournament_id': tournament.id, 'player_a': players[0]['first_name'], 'player_b': players[1]['first_name'], 'player_c': players[2]['first_name'], 'player_d': players[3]['first_name']})


class UpdateScore(APIView):
    def post(self, request):
        winner_one_name: str = None
        winner_two_name: str = None
        print('UpdateScore ==> ', request.data)
        username = request.data.get('username')
        data = request.data
        player = get_user_from_api(username)
        print ('player :::::::> ', player)
        tournament = get_object_or_404(Tournament, id=request.data.get('tournament_id'))
        if data['score'] == 5 and tournament.winner_one is None:
            tournament.winner_one = player['id']
            winner_one_name = player['username']
            print ('----------------------')
            print ('winner_one', tournament.winner_one)
            print ('----------------------')
            return Response({'message': 'Score updated successfully'})
        elif data['score'] == 5 and tournament.winner_two is None and  winner_one_name != data['username']:
            tournament.winner_two = player['id']
            winner_two_name = player['username']
            print ('----------------------')
            print ('winner_two', tournament.winner_two)
            print ('----------------------')
            tournament.winner_two = data['username']
            return Response({'message': 'Score updated successfully'})
        
        # print all the tournament data
        for key, value in tournament.__dict__.items():
            print(f'{key}: {value}')
        
        tournament.save()
        return Response({'message': 'Score updated successfully'})
    
class CompleteTournament(APIView):
    def post(self, request):
        print('CompleteTournament', request.data)
        tournament = get_object_or_404(Tournament, id=request.data.get('tournament_id'))
        tournament.status = 'Completed'
        tournament.save()
        return Response({'message': 'Tournament completed successfully'})