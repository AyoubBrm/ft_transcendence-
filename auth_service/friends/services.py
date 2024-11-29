import requests
from rest_framework.response import Response

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
 