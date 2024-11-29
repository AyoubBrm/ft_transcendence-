from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from rest_framework.exceptions import ValidationError
from .models import User, GameBoot


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email', 'password', 'avatar']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        username = validated_data.get('username', 'default_user')  # Valeur par défaut si username est absent
        avatar_url = f'https://robohash.org/{username}?set=set3'
        validated_data['avatar'] = avatar_url
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance
    def to_representation(self, instance):
        response = super().to_representation(instance)
        # Supprimez les champs null de la réponse
        return {key: value for key, value in response.items() if value is not None}

class GameBootSeri(serializers.ModelSerializer):
    class Meta:
        model = GameBoot
        fields = '__all__'