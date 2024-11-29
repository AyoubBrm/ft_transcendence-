import requests
from rest_framework.response import Response

def get_user_from_api(username):
        """
        Function to get user details from the authentication service
        """
        try:
            url = f'http://auth:3000/api/auth/user/{username}/'    
            response = requests.get(url)
            print('response ===>', response)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching user data: {e}")
            return Response({"message": "Username not found!"}, status=404)

def get_user_from_api_by_id(user_id):
    try:
        url = f'http://auth:3000/api/auth/user/id/{user_id}/' 
        response = requests.get(url)
        print('url', response)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching user data: {e}")
        return Response({"message": "User not found!"}, status=404)
            
        
def get_all_users():
     try:
        url = f'http://auth:3000/api/auth/users/'
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
     except requests.exceptions.RequestException as e:
        print(f"Error fetching users: {e}")
        return Response({"message": "Error fetching users"}, status=404)