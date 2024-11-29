import json
import time
# from accounts.models import User
from typing import Any
import asyncio
import jwt
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from game.consumers import GameRoom, GameState
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from game.services import (
    get_user_from_api,
    get_user_from_api_by_id,
)

players = []
game_rooms = {}
winners = []  # List to store winners for the next round
winners_classes = []
authentication_classes = [JWTAuthentication]
permission_classes = [IsAuthenticated]
game_started = False
champion = None
no_ongoing_tournament = True
g_id: int = 0
disconnected_players = []
peer_loock: list[bool] = [False, False, False, False]
started_championship = False

class TournamentConsumer(AsyncWebsocketConsumer):
    player_num = 4  # Total number of players in the tournament
    match_size = 2  # Each match is a 1v1
    user_name = ''
    id: int = 0

    async def connect(self):
        global no_ongoing_tournament
        # Authenticate and connect user
        try:
            #print (f"Scope : {self.scope}")
            self.user_name = await self.get_username_from_db() 
        except Exception as e:
            print (f"Error in connect : {e}")
            await self.close()
            return
        if not self.user_name:
            await self.close()
            return

        # Check if the user is already connected
        for player in players:
            if player.user_name == self.user_name:
                print (f'{self.user_name} is already connected')
                try:
                    await self.disconnect(1000)
                except Exception as e:
                    print (f"Error in disconnect : {e}")
                await self.close()
                return

        self.room_id = await self.assign_room(self.user_name)
        await self.accept()
        global g_id
        self.id = g_id 
        g_id += 1
        print (f'{self.user_name} connected')
        players.append(self)
        for player in players:
            await player.broadcast_usernames()

        if not no_ongoing_tournament:
            print ('the tournament has already started, to late for you :', self.user_name)
        # Start the game if enough players are in the room
        if len(players) == self.player_num and no_ongoing_tournament:  # self.player_num:
            for idx, player in enumerate(players):
                player.opponent = players[idx + 1] if idx % 2 == 0 else players[idx - 1]
            if self in players and not no_ongoing_tournament:
                print ('kiked out')
                disconnected_players.append(self)
                self.disconnect(1000)
                self.close()
            for idx, player in enumerate(players):
                print (f"player: {player.user_name}, opponent: {player.opponent.user_name} idx : {idx}")
            print (f"starting match {self.user_name} : {self.opponent.user_name}")
            print ('starting match for ', self.user_name)
            await self.start_match(self, self.opponent)
            #await asyncio.sleep(4)
            print ('closing the ongoing tournament, no more users allowed')
            no_ongoing_tournament = False
            # creating a loop to check for the winners

        elif len(players) > self.player_num:
            # wait for the next round
            print ('waiting for the next round')
            self.disconnect(1000)
            self.close()
            pass  # Handle overflow later
        
        
    async def get_username_from_db(self) -> str | None:
        if "=" in self.scope['query_string'].decode():
            self.token = self.scope['query_string'].decode().split('=')[1]
            print (f"Token : {self.token}")
            if self.token == 'null': # means i got token=null from the frontend
                print ('--------so its an intra-------')
                self.token = self.scope['cookies'].get('jwt')
            user = await self.authenticate_user(self.token)
            self.user_name = user['username']
            print (f"User : {user['username']}")
            if user is not None:
                self.user = user
            else:
                await self.close()
                return
        else:
            self.user = self.scope['user']
            self.user_name = self.user.username
            if not self.user.is_authenticated:
                await self.close()
                return
        return self.user_name


        
    @database_sync_to_async
    def authenticate_user(self, token: str) -> None :
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)  # This is a sync method
            print (f"Validated Token : {validated_token['user_id']}")
            user = get_user_from_api_by_id(validated_token['user_id'])
            print('User=========>', user)
            return user
        except Exception as e:
            return None

        

    async def start_championship(self):
        await asyncio.sleep(1)
        if (len(players) != self.player_num):
            print ('not enough players')
            for player in players:
                await player.send(text_data=json.dumps({
                    'type': 'bye',
                }))
                player.disconnect(1000)
                player.close()
            return
        global started_championship
        if started_championship:
            return
        global g_id
        #if self.user_name in [el.user_name for el in winners_classes]:
        if g_id == 3:
            started_championship = True
        print ('starting the championship : ', winners)
        print (f'self: {self}')
        await self.send(text_data=json.dumps({
            'type': 'start_game',
        }))
        
    async def start_match(self, player1, player2):
        # Notify players about the match
        print (f"Starting match between {player1.user_name} and {player2.user_name}")
        await asyncio.sleep(1)
        for player in players:
            await asyncio.sleep(0.1 * self.id)
            await player.send(text_data=json.dumps({
                'type': 'start_game',
                'self': player1.user_name,
                'opponent': player2.user_name
            }))
        print ('sending the start game message')

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'match_result':
            await self.handle_match_result(data['winner'])
        if data['type'] == 'get_update':
            await self.broadcast_winners()
        if data['type'] == 'start_championship':
            if self.user_name in [el.user_name for el in winners_classes]:
                # game_started = True
                print ('starting the championship')
                print ('self : ', self.user_name)
                await self.start_championship()
                return
        if data['type'] == 'end_tournament':
            winners_classes.clear()
            winners.clear()
            players.clear()
            game_rooms.clear()
            disconnected_players.clear()
            global no_ongoing_tournament
            no_ongoing_tournament = True
            global g_id
            g_id = 0
            global started_championship
            started_championship = False
            print ('tournament ended')
            await asyncio.sleep(5)
            # await self.close()
            # await self.disconnect(1000)
                # await self.start_match(winners_classes[0], winners_classes[1])

            
    async def broadcast_winners(self):
        usernames = [p.user_name for p in players]
        # for player in players:
        try:
            if (len(players) != self.player_num):
                print ('not enough players')
                for player in players:
                    await player.send(text_data=json.dumps({
                        'type': 'bye',
                    }))
                    player.disconnect(1000)
                    player.close()
                return
            for player in players:
                tmp_dict: dict = {
                    'type': 'winners',
                    'winners': winners,
                    'players': usernames,
                    'round': "Round 1" if len(winners) == 1 else "Round 2" if len(winners) == 2 else "Round 3",
                }
                print (f"tmp_dict : {tmp_dict}")
                await player.send(text_data=json.dumps(tmp_dict))
        except Exception as e:
            pass
            #print(f"Error sending message to player: {e}")


    async def declare_winner(self, champion):
        # Send a final message to all players with the winner
        for player in players:
            await player.send(text_data=json.dumps({
                'type': 'final_winner',
                'winner': champion
            }))

    async def disconnect(self, close_code):
        pass
        # Handle disconnect
        try:
            print (f'{self.user_name} disconnected')
            print ('closing the websocket...')
            await self.close()
#        if close_code == 1000:
#            await self.send(text_data=json.dumps({'type': 'error', 'message': self.user['username'] + ' is already connected'}))

        # Notify all players about the updated usernames
            for player in players:
                if player:
                    await player.broadcast_usernames()
            if self in players:
                await asyncio.sleep(2)
                await players.remove(self)
        except Exception as e:
            pass
            #print (f"Error while disconnect : {e}")


    async def broadcast_usernames(self):
        usernames = [p.user_name for p in players]
        # Directly send usernames to each player
        for player in players:
            await player.send(text_data=json.dumps({'type': 'usernames', 'usernames': usernames, 'player_num': self.player_num}))

    @database_sync_to_async
    def assign_room(self, username):
        # Assign to a room with space or create a new one
        for room_id, room in game_rooms.items():
            if len(room.players) < self.match_size:
                room.players.append(self)
                return room_id

        # Create a new room if no space in current rooms
        new_room_id = len(game_rooms)
        game_rooms[new_room_id] = GameRoom(room_id=new_room_id)
        game_rooms[new_room_id].players.append(self)
        return new_room_id

# Constants
CANVAS_WIDTH: int = 1000
CANVAS_HEIGHT: int = 800 
BALL_RADIUS: int = 15
RACKET_WIDTH: float = 20
RACKET_HEIGHT: float = 140
INITIAL_BALL_SPEED: int = 15
MAX_SCORE: int = 5
GAME_TICK_RATE: int = 30  # fps
RACKET_POS: float = 50
RACKET_SPEED: float = 20

class TournamentGameConsumer(AsyncWebsocketConsumer):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    room_group_name: str = "group_01" # default room
    room_id: int = 1 # default room
    room: GameRoom = None
    # user: User | dict = None
    user_name: str = None
    breaker = False
    id: int = 0
    # def get
            

    async def connect(self) -> None:
        # print (f"Scope : {self.scope}")
        print ('welcome to our heros ', players)
        try:
            self.user_name = await self.get_username_from_db() 
        except Exception as e:
            print (f"Error in connect : {e}")
            await self.close()
        self.room_id = await self.assign_room(self.user_name)
        self.room_group_name = f'room_{self.room_id}'
        print (f"creating room : {self.room_group_name}")
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        for player in players:
            if player.user_name == self.user_name:
                self.id = player.id
                break
        await self.accept()
        await self.send_init_state()
        self.room = game_rooms[self.room_id]
        if self.user_name in [el.user_name for el in disconnected_players]:
            print ('kicked out')
            self.disconnect(1000)
            self.close() 
        if len(self.room.players) == 2 and not self.room.game_loop_task:
            self.room.game_loop_task = True
            other_player = self.room.players[0] if self.room.players[1] == self else self.room.players[1]
            for i, player in enumerate(players):
                print (f"player : {player.user_name}")
                if player.user_name == self.user_name:
                    self.opponnet = players[i + 1] if i % 2 == 0 else players[i - 1]
                    break
            await other_player.send_player_info(self.user_name)
            # await self.start_countdown(other_player)
            self.room.game_state.start_game()
            self.room.game_loop_task = asyncio.create_task(self.game_loop())
        
        
    async def get_username_from_db(self) -> str | None:
        if "=" in self.scope['query_string'].decode():
            self.token = self.scope['query_string'].decode().split('=')[1]
            print (f"Token : {self.token}")
            if self.token == 'null': # means i got token=null from the frontend
                print ('--------so its an intra-------')
                self.token = self.scope['cookies'].get('jwt')
            user = await self.authenticate_user(self.token)
            self.user_name = user['username']
            print (f"User : {user['username']}")
            if user is not None:
                self.user = user
            else:
                await self.close()
                return
        else:
            self.user = self.scope['user']
            self.user_name = self.user.username
            if not self.user.is_authenticated:
                await self.close()
                return
        return self.user_name


    @database_sync_to_async
    def authenticate_user(self, token: str) -> None :
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)  # This is a sync method
            print (f"Validated Token : {validated_token['user_id']}")
            user = get_user_from_api_by_id(validated_token['user_id'])
            print('User=========>', user)
            return user
        except Exception as e:
            return None


    async def send_player_info(self, opponent: str) -> None:
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_info',
                'opponent': opponent
            }
        )
        
    async def player_info(self, event: Any) -> None:
        opponent = event['opponent']
        await self.send(text_data=json.dumps({
            'type': 'player_info',
            'opponent': opponent
        }))
    async def start_countdown(self, other) -> None:
        data: dict = {
                    'type': 'countdown',
                    'countdown': ""
                }
        changes: list = [n for n in range(3, 0, -1)]
        for change in changes:
            data['countdown'] = change
            await self.send(text_data=json.dumps(data))
            await other.send(text_data=json.dumps(data))
            await asyncio.sleep(1)


    async def disconnect(self, keycode) -> None:
        try:
            peer_loock[self.id] = False
            self.breaker = True
            if self.room.game_loop_task:
                self.room.game_loop_task.cancel()
                self.room.game_loop_task = None
            # Leave the room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        except Exception as e:
            print (f"Error in room discarding : {e}")
        
        try:
            # Remove player from room
            self.room = game_rooms.get(self.room_id)
            if self.room:
                self.room.players = [p for p in self.room.players if p.channel_name != self.channel_name]
                # Notify the other player
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'player_disconnected',
                        'message': f'{self.user_name} has disconnected.'
                    }
                )
        except Exception as e:
            pass
            #print (f"Error in notifying disconnect : {e}")
        
        try:
                # cancel game loop
              #  if self.room.game_loop_task:
              #      self.room.game_loop_task.cancel()
              #      self.room.game_loop_task = None
                # If no players left, delete the room
                await self.close ()
                if not self.room.players:
                    del game_rooms[self.room_id]
        except Exception as e:
            print (f"Error in disconnect : {e}")
            try:
                await self.close()
                print (f'closing websocket for {self.user_name}')
            except Exception as e:
                print (f"Error in closing websocket : {e}")
                print ('maybe its already closed')
        
        
    async def receive(self, text_data: Any) -> None:
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'player_move':
                await self.update_paddles_position(data)
                tmp = data.get('player_id')
                if tmp == 1:
                    self.room.game_state.racket1_pos = data.get('racket1_pos') 
                else:
                    self.room.game_state.racket2_pos = data.get('racket2_pos')
            elif message_type == 'game_over':
                print("the game is over my bro")
                await self.disconnect(1000)
            elif message_type == 'enemy_disconnected':
                try:
                    await self.send(text_data=json.dumps({
                        'type': 'game_over',
                        'winner': self.user_name
                    }))
                    winners.append({
                        'winner': self.user_name,
                        'player1': self.room.players[0].user_name,
                        'player2': self.room.players[1].user_name
                    })
                    winners_classes.append(self)
                except Exception as e:
                    pass
                    #print (f"Error in enemy disconnected : {e}")



        except Exception as e:
            print(f"Error in receive: {e}")
            print ('disconnecting ...')
            await self.disconnect(1000)
            print (f"closing websocket for {self.user_name} ...")
            await self.close()

    async def update_paddles_position(self, data: dict[str, Any]) -> None:
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'moves',
                'racket1_pos': data.get('racket1_pos'),
                'racket2_pos': data.get('racket2_pos')
            }
        )
        
    async def moves(self, event: Any) -> None:
        racket1_pos = event['racket1_pos']
        racket2_pos = event['racket2_pos']
        await self.send(text_data=json.dumps({
            'type': 'moves',
            'racket1_pos': racket1_pos,
            'racket2_pos': racket2_pos
        }))


    async def send_init_state(self) -> None:
        self.room = game_rooms.get(self.room_id)
        if not self.room:
            return

        game_state = {
            'type': 'init_state',
            'game_state': {
                'player_id': self.room.players.index(self) + 1,
                'room_id': self.room_id,
                'room_name': self.room_group_name,
                'ball_speed': self.room.game_state.ball_speed,
                'racket1_pos': self.room.game_state.racket1_pos,
                'racket2_pos': self.room.game_state.racket2_pos,
                'ball_pos': self.room.game_state.ball_pos,
                'score1': self.room.game_state.score1,
                'score2': self.room.game_state.score2,
                'player': self.room.players[0].user_name,
                'opponent': self.room.players[1].user_name if len(self.room.players) > 1 else 'waiting...',
                'direction': self.room.game_state.ball_dir,
                'racket_speed': self.room.game_state.racket_speed,
                'racket_width': RACKET_WIDTH,
                'racket_height': RACKET_HEIGHT,
                'canvas_width': CANVAS_WIDTH,
                'canvas_height': CANVAS_HEIGHT,
            }
        }

        await self.send(text_data=json.dumps(game_state))

    async def send_game_state(self, state: dict) -> None:
        try:
            await self.send(text_data=json.dumps({
                'type': 'game_state',
                'state': state,
                'direction': self.room.game_state.ball_dir,
                'ball_speed': self.room.game_state.ball_speed,
            }))
        except Exception as e:
            print (f"Error in sending game state : {e}")
            self.breaker = True
            try:
                await self.disconnect(1000)
            except Exception as e:
                print (f"Error in disconnecting : {e}")
        

    async def player_disconnected(self, event:  Any) -> None:
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': message,
        }))

    async def game_loop(self) -> None:
        try:
            await asyncio.sleep(0.5)
            while True:
                await asyncio.sleep(1 / GAME_TICK_RATE)
                if self.breaker:
                    break
                await self.update_game_state(self.room.game_state)
                elapsed_time = self.room.game_state.get_elapsed_time()
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'broadcast_game_state',
                        'state': {
                            'ball_pos': self.room.game_state.ball_pos,
                            'racket1_pos': self.room.game_state.racket1_pos,
                            'racket2_pos': self.room.game_state.racket2_pos,
                            'score1': self.room.game_state.score1,
                            'score2': self.room.game_state.score2,
                            'elapsed_time': elapsed_time,
                            'fps': GAME_TICK_RATE
                            }
                    }
                )
        except asyncio.CancelledError:
            pass



    async def update_game_state(self, game_state: GameState) -> None:
        # Update ball position
        game_state.ball_pos['x'] += game_state.ball_dir['x'] * game_state.ball_speed
        game_state.ball_pos['y'] += game_state.ball_dir['y'] * game_state.ball_speed

        # Check for collisions with top and bottom walls
        if game_state.ball_pos['y'] - BALL_RADIUS < 0:  # Collision with top wall
            game_state.ball_pos['y'] = (BALL_RADIUS) # Reset position to avoid overlap
            game_state.ball_dir['y'] *= -1  # Reverse direction

        elif game_state.ball_pos['y'] + BALL_RADIUS > CANVAS_HEIGHT:  # Collision with bottom wall
            game_state.ball_pos['y'] = CANVAS_HEIGHT - (BALL_RADIUS)  # Reset position to avoid overlap
            game_state.ball_dir['y'] *= -1  # Reverse direction

        # elif game_state.ball_pos['y'] - BALL_RADIUS < 0 or game_state.ball_pos['y'] + BALL_RADIUS > CANVAS_HEIGHT:
        #     game_state.ball_dir['y'] *= -1

        # Check for collisions with rackets
        game_state.check_collision_with_racket()
        # Check for game over
        if game_state.score1 >= MAX_SCORE or game_state.score2 >= MAX_SCORE:
            # Handle game over logic here (e.g., reset game, notify players)
            await asyncio.create_task(self.notify_game_over())
            # Notify players about game over
            
            print (f'closing websocket for {self.user_name}')
            print ('disconnecting ...')


        # Check for scoring
        if game_state.ball_pos['x'] - BALL_RADIUS <= 0:
            game_state.score2 += 1
            await asyncio.sleep(0.5)
            game_state.reset_ball(direction='left')
        elif game_state.ball_pos['x'] + BALL_RADIUS >= CANVAS_WIDTH:
            game_state.score1 += 1
            await asyncio.sleep(0.5)
            game_state.reset_ball(direction='right')

    def serialize_game_state(self, game_state: GameState) -> dict:
        return {
            'ball_pos': game_state.ball_pos,
            'racket1_pos': game_state.racket1_pos,
            'racket2_pos': game_state.racket2_pos,
            'score1': game_state.score1,
            'score2': game_state.score2
        }

    async def broadcast_game_state(self, event):
        state = event['state']
        if self.breaker:
            return
        await self.send_game_state(state)

    async def notify_game_over(self):
        self.room = game_rooms.get(self.room_id)
        if not self.room:
            return
        # for player in self.room.players:
        #     # print (f"player : {player.user}")
        winner = self.room.players[0].user_name if self.room.game_state.score1 >= MAX_SCORE else self.room.players[1].user_name
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_over',
                'winner': winner
            }
        )

    async def game_over(self, event: Any) -> None:
        winner = event['winner']
        try:
            global champion
            await self.send(text_data=json.dumps({
                'type': 'game_over',
                'winner': winner
            }))
            winner_data = {
                'winner': winner,
                'player1': self.room.players[0].user_name,
                'player2': self.room.players[1].user_name
            }
            print (f"winner data : {winner_data}")
            # global counter
            # counter += 1
            if winner_data not in winners:
                winners.append(winner_data)
            # elif len(winners) == 3:
            #     champion = winner
            #     print (f"champion : {champion}")
            #     for player in players:
            #         try:
            #             await player.send(text_data=json.dumps({
            #                 'type': 'winner_winner_chicken_dinner',
            #                 'champion': champion
            #             }))
            #         except Exception as e:
            #             print (f"Error in sending champion message : {e}")
            print ("winner len : ", len(winners))
            print ("winner data : ", winner_data)
            print ("winner : ", winner, " and self : ", self.user_name)
            if winner_data["winner"] == self.user_name and not champion:
                winners_classes.append(self)
        except Exception as e:
            pass
            # await self.disconnect(1000)

    @database_sync_to_async
    def assign_room(self, username: str) -> int:
        # Assign the player to an existing room with less than 2 players
        for room_id, self.room in game_rooms.items():
            if len(self.room.players) < 2:
                self.room.players.append(self)
                return room_id
        # Create a new room
        new_room_id = len(game_rooms)
        game_rooms[new_room_id] = GameRoom(room_id=new_room_id)
        game_rooms[new_room_id].players.append(self)
        return new_room_id
