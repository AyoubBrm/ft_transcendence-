# python helpers.py
python3 manage.py makemigrations authentication_service
python3 manage.py migrate authentication_service
python3 manage.py makemigrations friends
python3 manage.py migrate friends
python3 manage.py makemigrations chat
python3 manage.py migrate chat
python3 manage.py migrate
python3 manage.py populate_users
exec "$@"