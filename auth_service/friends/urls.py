from django.urls import path
from . import views

urlpatterns = [
    path('methods/', views.Request_methods.as_view(), name='methods'),
    path('search/', views.Search.as_view(), name='search'),
    path('profile/', views.Userprofile.as_view(), name='profile'),
    path('ufriends/', views.Userfriends.as_view(), name='friends'),
    path('find/', views.WhereUser.as_view(), name='find'),
]
