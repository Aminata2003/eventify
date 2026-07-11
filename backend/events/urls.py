from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import DashboardStatsViewSet, EventViewSet, OrganizerRegisterView, PaymentViewSet, RegistrationViewSet, UserRegisterView, UserViewSet, ReviewViewSet

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
    path("events/<int:event_id>/cancel/", RegistrationViewSet.as_view({"delete": "cancel_registration"}), name="event-cancel"),
    path("events/my-events/", EventViewSet.as_view({"get": "my_events"}), name="my-events"),
    path("events/<int:event_id>/reviews/", ReviewViewSet.as_view({"get": "list", "post": "create"}), name="event-reviews"),
    path("payments/initiate/", PaymentViewSet.as_view({"post": "initiate"}), name="payment-initiate"),
    path("payments/confirm/", PaymentViewSet.as_view({"post": "confirm"}), name="payment-confirm"),
]

urlpatterns += router.urls
