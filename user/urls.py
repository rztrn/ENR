from django.urls import path
from .views import LoginView, login_page

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('login-page/', login_page, name='login_page'),
]
