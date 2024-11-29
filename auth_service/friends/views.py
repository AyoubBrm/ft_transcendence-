from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest
from authentication_service.models import User
from django.contrib.auth import authenticate, login
from django.contrib import messages 
from .models import Profile, friend_request
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import Serializer_User, SerializerProfile, SerializerFriends
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from django.utils.decorators import method_decorator 
from django.db.models import Q
import json
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from .services import get_user_from_api_by_id

def get_user_from_token(request):
    token = request.COOKIES.get('access')
    jwt = JWTAuthentication()
    validated_token = jwt.get_validated_token(token)
    _user = jwt.get_user(validated_token)
    return _user


def Unblock_user(P_user : Profile ,s_user : User ,s_user_id : int):
    if P_user.block.filter(id=s_user_id):
        P_user.block.remove(s_user)

def Accept_method(sender : friend_request):
    sender.status = True
    sender.save()


def Reject_method(P_user : Profile, s_user_id : int, s_user : User):
    if P_user.waiting.filter(id=s_user_id).exists():
        P_user.waiting.remove(s_user)

def Block_user(self, user ,P_user : Profile, s_user_id : int,  s_user : User):
    user_P : Profile = self.profile.get(user=s_user)
    if user_P.friends.filter(id=user.id).exists():
      user_P.friends.remove(user)
    if P_user.friends.filter(id=s_user_id).exists():
       P_user.friends.remove(s_user)
    elif P_user.waiting.filter(id=s_user_id).exists():
        P_user.waiting.remove(s_user)
    P_user.block.add(s_user)

def Unfriend(self, P_user : Profile , s_user_id : int, s_user : User, _user : User):
    user_P : Profile = self.profile.get(user=s_user)
    if P_user.friends.filter(id=s_user_id).exists():
        P_user.friends.remove(s_user)
    if user_P.friends.filter(id=_user.id).exists():
        user_P.friends.remove(_user)

def Createfriend_rolation(_reciver : User, user_P : Profile, resiver_user_P : Profile, _user):
    if user_P.block.filter(id=_reciver.id).exists():
        content = {"error" : " You Can't add This User. "}
        return Response(content, status=status.HTTP_403_FORBIDDEN)
    if resiver_user_P.block.filter(id=_user.id).exists():
        content = {"error" : " You Get Blocked From This User. "}
        return Response(content, status=status.HTTP_403_FORBIDDEN)
    if user_P.friends.filter(id=_reciver.id).exists():
        content = {"error" : " Already Have This User As Friend. "}
        return Response(content, status=status.HTTP_400_BAD_REQUEST) 
    if user_P.waiting.filter(id=_reciver.id).exists():
        content = {"error" : " This User Alrady Invite You And Waiting Your Confirm. "}
        return Response(content, status=status.HTTP_409_CONFLICT)
    if resiver_user_P.waiting.filter(id=_user.id).exists():
        content = {"error" : " You have allredy sent request wait for response. "}
        return Response(content, status=status.HTTP_409_CONFLICT)
    if not friend_request.objects.filter(sender=_user, reciver=_reciver).exists():
        friend = friend_request.objects.create(sender=_user, reciver=_reciver)
        friend.save()
        content = {"message" : " request send . "}
        return Response(content, status=status.HTTP_200_OK)
    else:
        return Response(status=status.HTTP_400_BAD_REQUEST)

def  ADD_method(self, _user, _reciver_id):
    if self.user.filter(id=_reciver_id).exists():
        _reciver : User = self.user.get(id=_reciver_id)
        user_P : Profile = self.profile.get(user=_user)
        resiver_user_P : Profile = self.profile.get(user=_reciver)
        return Createfriend_rolation(_reciver, user_P, resiver_user_P, _user)
    else:
        content = {"error" : " Invalid username. "}
        return Response(content, status=status.HTTP_404_NOT_FOUND)

class Userprofile(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            profile = Profile.objects.all()
            _user = get_user_from_token(request)
            userprofile = Profile.objects.get(user=_user)
            Serializer = SerializerProfile(userprofile)
            return Response({"Profile" : Serializer.data})
        except Exception as e:
            print('e========>', e)
            content = {"error" : "Please login"}
            return Response(content, status=status.HTTP_401_UNAUTHORIZED)


class WhereUser(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            _user = get_user_from_token(request)
            me = _user.id
            user_id = request.data.get("user_id")
            userprofile = Profile.objects.get(id=user_id)
            if userprofile.friends.filter(id=me).exists():
                return Response({"status" : "Friend"}, status=status.HTTP_200_OK)
            elif userprofile.waiting.filter(id=me).exists():
                return Response({"status" : "Waiting"}, status=status.HTTP_200_OK)
            elif userprofile.block.filter(id=me).exists():
                return Response({"status" : "Block"}, status=status.HTTP_200_OK)
            else:
                return Response({"status" : "Not on list"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"status" : "Not on list"}, status=status.HTTP_400_BAD_REQUEST)

class Userfriends(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            profile = Profile.objects.all()
            _user = get_user_from_token(request)
            userprofile = Profile.objects.get(user=_user)
            Serializer = SerializerFriends(userprofile)
            ids: list = Serializer.data['friends']
            return Response({"Friends" : [get_user_from_api_by_id(id)['username'] for id in ids]})

        except Exception as e:
            print('e========>', e)
            content = {"error" : "Please login"}
            return Response(content, status=status.HTTP_401_UNAUTHORIZED)

class Search(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]
    def post(self, request):
        user = User.objects.all()
        try:
            _username_or_email = request.data.get("user_or_email")
            if user.filter(Q (username__startswith=_username_or_email) | Q (email=_username_or_email)).exists():
                theuser = user.filter(Q (username__startswith=_username_or_email) | Q (email=_username_or_email))
                serializer = Serializer_User(theuser, many=True)
                return Response(serializer.data)
            else:
                content = {"error" : " User not fond ."}
                return Response(content, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            content = {"error" : "Enter username_or_email ."}
            return Response(content, status=status.HTTP_400_BAD_REQUEST)

class Request_methods(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]
    user = User.objects.all()
    profile = Profile.objects.all()
    request_friend = friend_request.objects.all()
    sender = None
    def post(self, request):
        try:
            _user = get_user_from_token(request)
            method = request.data.get("status") 
            s_user_id : int = request.data.get('user_id')
            s_user : User = self.user.get(id=s_user_id)
            P_user : Profile = self.profile.get(user=_user)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if method == "ADD":
            return ADD_method(self, _user, s_user_id)
        elif method == "REJECT" or method == "BLOCK" or method == "ACCEPT" \
                or method == "UNBLOCK" or method == "UNFRIEND" or method == "CANCEL":
            if self.request_friend.filter(sender=s_user, reciver=_user).exists():
                self.sender : friend_request = self.request_friend.get(sender=s_user, reciver=_user)
            if method == "ACCEPT":
                Accept_method(self.sender)
            elif method == "REJECT":
                Reject_method(P_user, s_user_id, s_user)
            elif method == "BLOCK":
                Block_user(self, _user, P_user, s_user_id, s_user)
            elif method == "UNBLOCK":
                Unblock_user(P_user, s_user, s_user_id)
            elif method == "UNFRIEND":
                Unfriend(self, P_user, s_user_id, s_user, _user)
            elif method == "CANCEL":
                try:
                    user_P : Profile = self.profile.get(user=s_user)  
                    if self.request_friend.filter(sender=_user, reciver=s_user).exists():  
                        self.sender : friend_request = self.request_friend.get(sender=_user, reciver=s_user)
                    user_P.waiting.remove(_user)
                except Exception:
                    return Response(status=status.HTTP_400_BAD_REQUEST)
            if self.sender != None:
                self.sender.delete()
        P_user.save()
        return Response(status=status.HTTP_200_OK)