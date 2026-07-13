import os
import dj_database_url
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-key")

DEBUG = os.getenv("DEBUG", "true").lower() == "true"

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1"
).split(",")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Cloudinary
    "cloudinary",
    "cloudinary_storage",

    # API
    "rest_framework",
    "corsheaders",
    "drf_yasg",

    # Apps
    "events",

    # Filters
    "django_filters",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # CORS doit être avant CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "eventify_backend.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "eventify_backend.wsgi.application"
ASGI_APPLICATION = "eventify_backend.asgi.application"



# ==========================
# DATABASE
# ==========================

# Local : SQLite si DB_USE_SQLITE=true
# Production Render : DATABASE_URL PostgreSQL

USE_SQLITE = os.getenv(
    "DB_USE_SQLITE",
    "false"
).lower() == "true"


if USE_SQLITE:

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

else:

    DATABASES = {
        "default": dj_database_url.config(
            default=os.getenv("DATABASE_URL")
        )
    }



# ==========================
# PASSWORD VALIDATION
# ==========================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME":
        "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.MinimumLengthValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.CommonPasswordValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]



# ==========================
# LANGUAGE / TIMEZONE
# ==========================

LANGUAGE_CODE = "fr-fr"

TIME_ZONE = "Africa/Dakar"

USE_I18N = True

USE_TZ = True



# ==========================
# STATIC / MEDIA / CLOUDINARY
# ==========================


STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


HAS_CLOUDINARY_CONFIG = all([
    os.getenv("CLOUDINARY_CLOUD_NAME"),
    os.getenv("CLOUDINARY_API_KEY"),
    os.getenv("CLOUDINARY_API_SECRET"),
])

STORAGES = {

    "default": {
        # Le stockage local évite une erreur 500 lors de la création si les
        # identifiants Cloudinary ne sont pas encore configurés.
        "BACKEND": (
            "cloudinary_storage.storage.MediaCloudinaryStorage"
            if HAS_CLOUDINARY_CONFIG
            else "django.core.files.storage.FileSystemStorage"
        ),
    },


    "staticfiles": {
        "BACKEND":
        "django.contrib.staticfiles.storage.StaticFilesStorage",
    },

}


CLOUDINARY_STORAGE = {

    "CLOUD_NAME":
    os.getenv("CLOUDINARY_CLOUD_NAME"),

    "API_KEY":
    os.getenv("CLOUDINARY_API_KEY"),

    "API_SECRET":
    os.getenv("CLOUDINARY_API_SECRET"),

}


MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"



DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"



# ==========================
# AUTH USER
# ==========================

AUTH_USER_MODEL = "events.User"



# ==========================
# REST FRAMEWORK
# ==========================

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": (

        "rest_framework_simplejwt.authentication.JWTAuthentication",

        "rest_framework.authentication.SessionAuthentication",

    ),


    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.AllowAny",

    ),


    "DEFAULT_FILTER_BACKENDS": (

        "django_filters.rest_framework.DjangoFilterBackend",

    ),

}



# ==========================
# JWT
# ==========================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME":
    timedelta(days=1),

    "REFRESH_TOKEN_LIFETIME":
    timedelta(days=7),

}



# ==========================
# EMAIL
# ==========================

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "no-reply@eventify.dev"
)


EMAIL_BACKEND = os.getenv("EMAIL_BACKEND")


EMAIL_HOST = os.getenv("EMAIL_HOST", "")


EMAIL_PORT = int(
    os.getenv("EMAIL_PORT", "587")
)


EMAIL_HOST_USER = os.getenv(
    "EMAIL_HOST_USER",
    ""
)


EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD",
    ""
)


EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS",
    "true"
).lower() == "true"


EMAIL_USE_SSL = os.getenv(
    "EMAIL_USE_SSL",
    "false"
).lower() == "true"



if not EMAIL_BACKEND:

    if EMAIL_HOST:

        EMAIL_BACKEND = (
            "django.core.mail.backends.smtp.EmailBackend"
        )

    else:

        EMAIL_BACKEND = (
            "django.core.mail.backends.console.EmailBackend"
        )



# ==========================
# CORS
# ==========================


CORS_ALLOWED_ORIGINS = [

    "http://localhost:5173",

    "http://127.0.0.1:5173",

    "http://localhost:5175",

    "http://127.0.0.1:5175",

] + [

    origin
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        ""
    ).split(",")

    if origin

]



CORS_ALLOWED_ORIGIN_REGEXES = [

    r"^https://eventify.*\.vercel\.app$",

]


CORS_ALLOW_CREDENTIALS = True



# ==========================
# CSRF / HTTPS RENDER
# ==========================


CSRF_TRUSTED_ORIGINS = [

    origin
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        ""
    ).split(",")

    if origin

]


SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)
