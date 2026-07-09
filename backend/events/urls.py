from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import DashboardStatsViewSet, EventViewSet, OrganizerRegisterView, RegistrationViewSet, UserRegisterView, UserViewSet

router = DefaultRouter()
router.register(r"events", EventViewSet, basename="event")
router.register(r"users", UserViewSet, basename="user")
router.register(r"registrations", RegistrationViewSet, basename="registration")
router.register(r"dashboard/stats", DashboardStatsViewSet, basename="dashboard-stats")

urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", UserRegisterView.as_view(), name="user-register"),
    path("auth/register/organizer/", OrganizerRegisterView.as_view(), name="organizer-register"),
    path("events/<int:event_id>/register/", RegistrationViewSet.as_view({"post": "register"}), name="event-register"),
    path("events/my-events/", EventViewSet.as_view({"get": "my_events"}), name="my-events"),
]

urlpatterns += router.urls
