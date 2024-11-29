# your_app/management/commands/populate_users.py
import random
from django.core.management.base import BaseCommand
from authentication_service.models import User  # Replace 'your_app' with the name of your app
from friends.models import Profile

class Command(BaseCommand):
    help = "Populates the database with sample user data"

    def handle(self, *args, **kwargs):
        sample_users = [
            {
                "first_name": "adnan",
                "last_name": "adnan",
                "username": "adnan",
                "email": "adnan@example.com",
                "avatar" : "https://robohash.org/",
            },
            {
                "first_name": "ada",
                "last_name": "ada",
                "username": "ada",
                "email": "ada@example.com",
                "avatar" : "https://robohash.org/",
            },
            {
                "first_name": "hm",
                "last_name": "hm",
                "username": "hm",
                "email": "hm@example.com",
                "avatar" : "https://robohash.org/",
            },
            {
                "first_name": "ck",
                "last_name": "ck",
                "username": "ck",
                "email": "ck@example.com",
                "avatar" : "https://robohash.org/",
            },
            {
                "first_name": "ayoub",
                "last_name": "ayoub",
                "username": "ayoub",
                "email": "ayoub@example.com",
                "avatar" : "https://robohash.org/",
            },
            {
                "first_name": "berrim",
                "last_name": "berrim",
                "username": "berrim",
                "email": "yassineberrim99@gmail.com",
                "avatar" : "https://robohash.org/",
            },
        ]

        try:
            print ("---------- user creation ----------")
            for user_data in sample_users:
                try:
                    user = User.objects.create_user(
                        first_name=user_data["first_name"],
                        last_name=user_data["last_name"],
                        username=user_data["username"],
                        email=user_data["email"],
                        password=user_data["first_name"],
                        avatar=user_data["avatar"] + user_data["username"],
                    )
                    Profile.objects.create(user=user)
                    self.stdout.write(self.style.SUCCESS(f"User '{user_data['username']}' created successfully."))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error: {e}"))

            self.stdout.write(self.style.SUCCESS("Database populated with sample users."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))
        finally:
            print ("-----------------------------------")


