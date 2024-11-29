from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.views import APIView
from .serializers import UserSerializer
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import HttpResponseRedirect
import requests
from django.shortcuts import redirect
import pyotp
from django.shortcuts import get_object_or_404
# from django.conf import settings
import os
from friends.models import Profile
from authentication_service import settings
from django.core.mail import send_mail
from .models import GameBoot
import secrets
import string
from jwt import DecodeError

from .serializers import GameBootSeri

User = get_user_model()


class OTP:
    def __init__(self):
        self.otp = ""

    def generate_otp(self):
        self.otp = ''.join(secrets.choice(string.digits) for _ in range(6))
        return self.otp

    def verify_otp(self, user_otp):
        return self.otp == user_otp

class GenerateOTPView(APIView):
    def post(self, request):
        to_email = request.data.get('email')
        print('to_email', to_email)
        if not to_email:
            return Response(
                {"error": "Email is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        response = Response()
        try:
            otp_handler = OTP()
            otp = otp_handler.generate_otp()
            
            print('Generated OTP:', otp)

            subject = "Your Pong OTP, don't share it with anyone"
            message = f'Your OTP is: {otp}'
            from_email = settings.EMAIL_HOST_USER
            recipient_list = [to_email]
        except Exception as e:
            return Response(
                {"error": "Couldn't send the email."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
            # request.session['otp'] = otp
            # request.session['otp_email'] = to_email

            # print(f"Session ID: {request.session.session_key}")

            # print('request.session before', request.session.keys())

            # response.set_cookie(key='otp_email', value=to_email)
            # response.set_cookie(key='otp', value=otp)
            
            # user = User.objects.get(email=to_email)
            otp_token = RefreshToken()
            payload = {
                'email': to_email,
                'otp': otp,
                # 'user_id': user.id
            }
            otp_token.payload.update(payload)
            print('payload', payload)
            
            response.data = {
                'message': 'OTP sent successfully',
                'otp_token': str(otp_token)
            }
            return response
        except Exception as e:
            response.data = {
                'error': 'An error occurred while sending the email. Please try again.'
            }
            return response

class VerifyOTPView(APIView):
    def post(self, request):
        user_otp = request.data.get('otp')
        user_email = request.data.get('email')
        otp_token = request.data.get('otp_token')
        
        print('user_otp', user_otp)
        print('user_email', user_email)
        print('otp_token', otp_token)
        if not user_email or not otp_token:
            return Response(
                {"error": "OTP and email are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            decoded_token = UntypedToken(otp_token)
        except DecodeError:
            return Response(
                {"error": "Invalid token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        stored_otp = decoded_token.get('otp')
        stored_email = decoded_token.get('email')
        print('stored_otp', stored_otp)
        print('stored_email', stored_email)
        
        if user_email != stored_email:
            return Response(
                {"error": "Email does not match"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if user_otp != stored_otp:
            return Response(
                {"error": "Invalid OTP"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response = Response()
        user = User.objects.get(email=user_email)
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        response.set_cookie(key='access', value=str(access))
        response.set_cookie(key='refresh', value=str(refresh))
        response.data = {
            'message': 'OTP verified successfully',
            'access': str(access),
            'refresh': str(refresh)
        }
        response.status_code = status.HTTP_200_OK
        return response

class OtpUpdate(APIView):
    def post(self, request):
        token = request.COOKIES.get('access')
        if not token:
            raise AuthenticationFailed('Unauthorized')
        
        is_2fa_enabled = request.data.get('is_2fa_enabled')
        jwt = JWTAuthentication()
        validated_token = jwt.get_validated_token(token)
        user = jwt.get_user(validated_token)
        if is_2fa_enabled:
            user.is_2fa_enabled = True
        else:
            user.is_2fa_enabled = False
        user.save()
        return Response({'message': '2FA status updated successfully', 'is_2fa_enabled': user.is_2fa_enabled})
    
class OauthRedirect(APIView):
    def get(self, request):
        URL = os.getenv('URL')
        CLIENT_ID = os.getenv('CLIENT_ID')
        return Response({'url': f'https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={URL}/api/auth/oauth42/&response_type=code'})

class Oauth42(APIView):
    def get(self, request):
        print('code ======>', request.GET.get('code'))
        code = request.GET.get('code')
        if not code:
            raise AuthenticationFailed('No code provided')

        URL = os.getenv('URL')
        api_url = 'http://api.intra.42.fr/oauth/token'
        redirect_uri = f'{URL}/api/auth/oauth42/'
        
        print('redirect_uri', redirect_uri)
        print('client_id', os.getenv('CLIENT_ID'))
        print('client_secret', os.getenv('CLIENT_SECRET'))
        # Step 1: Get the access token
        try:
            response_token = requests.post(api_url, data={
                'code': code,
                'client_id': os.getenv('CLIENT_ID'),
                'client_secret': os.getenv('CLIENT_SECRET'),
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            })
            print('response_token', response_token)
        except requests.exceptions.RequestException as e:
            raise AuthenticationFailed(f'Error fetching token: {str(e)}')

        if response_token.status_code != 200:
            raise AuthenticationFailed('Invalid token response from 42 API')

        access_token = response_token.json().get('access_token')

        if not access_token:
            raise AuthenticationFailed('No access token received')

        # Step 2: Use the access token to get user info
        headers = {
            'Authorization': f'Bearer {access_token}'
        }

        try:
            response = requests.get('https://api.intra.42.fr/v2/me', headers=headers)
        except requests.exceptions.RequetException as e:
            raise AuthenticationFailed(f'Error fetching user info: {str(e)}')

        if response.status_code != 200:
            raise AuthenticationFailed('Failed to fetch user information')

        user_info = response.json()
        print('user_info', user_info)
        try:
            user, created = User.objects.get_or_create(
                email=user_info.get('email', ''),  # Use email instead of username
                defaults={
                    'username': user_info['login'],  # If you still need a username, set it here
                    'first_name': user_info.get('first_name', ''),
                    'last_name': user_info.get('last_name', ''),
                    'is_active': True,
                    'is_staff': False,
                    'is_superuser': False,
                    'avatar': user_info.get('image', {}).get('link', ''),
                }
            )
            Profile.objects.get_or_create(user=user)
        except Exception as e:
            return redirect('/login?error=user_already_exists')
        if created:
            user.save()
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        response = HttpResponseRedirect(os.getenv('URL'))
        response.data = {
            'access': str(access),
            'refresh': str(refresh)
        }
        response.set_cookie(key='access', value=str(access))
        response.set_cookie(key='refresh', value=str(refresh))
        return response 


class SignUp(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _user = User.objects.get(id=serializer.data["id"])
        Profile.objects.create(user=_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class Login(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        user = User.objects.filter(Q(username=username) | Q(email=email)).first()
        if user is None or not user.check_password(password):
            return Response({'error': 'Incorrect username or password'}, status=status.HTTP_404_NOT_FOUND)

        try:
            refresh = RefreshToken.for_user(user)
        except Exception as e:
            print ("Error: ", e)
            print ("lets make a migration using os.system")
            try:
                os.system ('python3 manage.py migrate')
                refresh = RefreshToken.for_user(user)
            except Exception as e:
                print ("Error: ", e)
                return Response({'error': 'Error while generating token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        is_2fa_enabled = user.is_2fa_enabled
        if is_2fa_enabled:
            response = Response()
            response.data = {
                'message': '2FA enabled',
                'is_2fa_enabled': is_2fa_enabled,
                'email': user.email
            }
            response.status_code = status.HTTP_403_FORBIDDEN
            return response
        
        access = refresh.access_token
        response = Response()
        response.data = {
            'access': str(access),
            'refresh': str(refresh)
        }
        response.set_cookie(key='access', value=str(access), httponly=True)
        response.set_cookie(key='refresh', value=str(refresh), httponly=True)
        return response
    
class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if refresh_token is None:
            raise AuthenticationFailed('No refresh token was found!')
        
        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = refresh.access_token
        except Exception as e:
            raise AuthenticationFailed('Invalid or expired token!')
        
        response = Response({
            'message': 'Token refreshed successfully'
        })
        response.set_cookie(key='access', value=str(new_access_token), httponly=True)
        response.set_cookie(key='refresh', value=str(refresh), httponly=True)
        return response

class UserView(APIView):
    def get(self, request, username=None, id=None):
        try:
            if username:
                user = User.objects.get(username=username)
            else:
                user = User.objects.get(id=id)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
    def post(self, request):
        try:
            username = request.data.get('username')
            user = get_object_or_404(User, username=username)
            print('User is =>', user)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=401)
        
class GetAllUsers(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class Me(APIView):
    def post(self, request):
        token = request.COOKIES.get('access')
        if not token:
            raise AuthenticationFailed('Unauthorized')
        
        jwt = JWTAuthentication()
        validated_token = jwt.get_validated_token(token)
        user = jwt.get_user(validated_token)
        return Response({'access': token,
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_2fa_enabled': user.is_2fa_enabled,
                        'avatar': user.avatar,
                    })

class Logout(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        response.data = {
            'message': 'success'
        }
        return response

class UpdateUser(APIView):
    # permission_classes = .sAuthenticated]
    # authentication_classes = [JWTAuthentication]
    def put(self,request):
        print('request.data', request.data)
        token = request.COOKIES.get('access')
        print(token)
        if not token:
            raise AuthenticationFailed('Unauthenticated')

        try:
            jwt = JWTAuthentication()
            validated_token = jwt.get_validated_token(token)
            user = jwt.get_user(validated_token)
            print('user', user)
        except Exception as e:
            print('Error:', e)
            return Response({'error': 'Invalid token or user not found'}, status=401)
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class getlevel(APIView):
    def get(self, request):
        
        username = request.GET.get('username')
        user = User.objects.get(username=username)
        if not user:
            return Response({'error': 'User not found'}, status=404)
        xp = user.xp
        level = user.level
        return Response({"userLevel": level, "userXp": xp})

class UpdateXpAndLevel(APIView):
    def post(self, request):
        print('XP and Level:', request.data)

        username = request.data.get('username')
        print('Username:', username)

        xp_change = request.data.get('xp', 1)  # La valeur à ajouter ou soustraire des XP
        level_change = request.data.get('level', 0)  # La valeur à ajouter au niveau
        result = request.data.get('result')  # `win` ou `loss`

        # Récupérer l'utilisateur à partir de la base de données
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=404)

        # Initialiser level et xp à 1 s'ils ne sont pas encore définis
        if user.xp is None:
            user.xp = 1
        if user.level is None:
            user.level = 1

        print(f"XP actuel: {user.xp}, Niveau actuel: {user.level}")

        # Calculer la mise à jour des XP en fonction du résultat
        if result == 'win':  # Pour une victoire
            user.xp += xp_change + (user.xp * 0.10)  # Augmenter l'XP de 10%
            print(f"XP mis à jour après victoire: {user.xp}")

        elif result == 'loss':  # Pour une défaite
            user.xp -= xp_change + (user.xp * 0.05)  # Diminuer l'XP de 5%
            # Si l'XP devient négatif, réinitialiser à 0
            if user.xp < 0:
                user.xp = 0
            print(f"XP mis à jour après défaite: {user.xp}")

        # Vérifier si l'XP dépasse 100 et passer au niveau suivant
        if user.xp >= 100:
            user.xp = 0  # Réinitialiser l'XP à 0
            user.level += 1  # Augmenter le niveau
            print(f"L'utilisateur a monté de niveau! Nouveau niveau : {user.level}")
        
        # Si l'XP est trop faible, envisager de rétrograder le niveau
        if user.xp < 0 and user.level > 1:
            user.level -= 1  # Rétrograder le niveau si l'XP est 0
            print(f"L'utilisateur a rétrogradé de niveau! Nouveau niveau : {user.level}")

        print(f"XP mis à jour : {user.xp}, Niveau mis à jour : {user.level}")

        # Sauvegarder les données mises à jour dans la base de données
        user.save()

        return Response({
            'message': 'XP et Niveau mis à jour avec succès',
            'username': user.username,
            'xp': user.xp,
            'level': user.level
        })
    
class AddGameBootMatch(APIView):
    def post(self, request):
        username = request.data.get("username")
        type = request.data.get("type")
        userScore = request.data.get("userScore")
        botScore = request.data.get("botScore")

        user = User.objects.filter(username=username).first()

        if not user:
            return Response({"error": "User not found"}, status=404)

        try:
            GameBoot.objects.create(
                username=username,
                type=type,
                userScore=userScore,
                botScore=botScore,
                isWinner=userScore > botScore
            )
        except Exception as e:
            return Response({"error": "Internal server error, try again later"}, status=500)
    
        return Response({"success":"Data saved successfully"}, status=201)
    
class GetGameBoot(APIView):
    def get(self, request):
        username = request.GET.get("username")
        type = request.GET.get("type")

        if not username:
            return Response({"error": "Missing informations"}, status=400)

        user = User.objects.filter(username=username).first()
        if not user:
            return Response({"error": "User not found"}, status=404)
        if not type:
            games = GameBoot.objects.filter(username=username)
            seri = GameBootSeri(games, many=True)
            return Response({"games": seri.data}, status=200)
        games = GameBoot.objects.filter(username=username, type=type)
        seri = GameBootSeri(games, many=True)
        return Response({"games": seri.data}, status=200)

        # print('username', username)
        # print('type', type)
        # print('userScore', userScore)
        # print('botScore', botScore)
        # return Response({"state":"Okey"})