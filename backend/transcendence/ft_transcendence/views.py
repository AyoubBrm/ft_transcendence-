
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseNotFound
from rest_framework.views import APIView

# def login_page(request):
#     if request.user.is_authenticated:
#         return redirect('main_page')
#     return render(request, 'home.html')


# @login_required
# def home_page(request):
#     return render(request, 'frontend/index.html')

# def not_found_view(request, exception):
#     # Redirect to the home page in case of page not found
#     return redirect('login_page')

# def index(request, path=''):
#     print('path', path)
#     # if path.startswith('api/'):

#     return HttpResponseNotFound('<h1>Api route not found!</h1>')