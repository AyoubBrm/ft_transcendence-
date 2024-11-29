python helpers.py

python manage.py makemigrations game
python manage.py migrate game
python manage.py makemigrations tournament
python manage.py migrate tournament
python manage.py migrate

exec python manage.py runserver '0.0.0.0:8000'