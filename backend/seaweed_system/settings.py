<<<<<<< HEAD
"""
Django settings for seaweed_system project.
"""

import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-rm^)#8h-_(87v3n!x0@hsn$8ng%jbvfwn_uiz^!4r^34)h!#+$'
DEBUG = True
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

SERVICE_NAME = os.getenv("SERVICE_NAME", "gateway").lower()

SERVICE_APPS = {
    "gateway": ["farmers", "production", "market", "inventory", "reports"],
    "farmers": ["farmers"],
    "production": ["farmers", "production"],
    "inventory": ["farmers", "inventory"],
    "market": ["farmers", "market"],
    "reports": ["farmers", "reports"],
}

BASE_APPS = [
=======
import os
from pathlib import Path

# Paths za mradi
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings (Zibadilishe wakati wa kwenda production)
SECRET_KEY = 'django-insecure-your-secret-key-here'
DEBUG = True
ALLOWED_HOSTS = ['*']

# Applications zilizosakinishwa
INSTALLED_APPS = [
>>>>>>> 36422b4 (Initial commit for main branch)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
<<<<<<< HEAD
    'rest_framework',
    'rest_framework_simplejwt',
]

INSTALLED_APPS = BASE_APPS + [
    app for app in SERVICE_APPS.get(SERVICE_NAME, SERVICE_APPS["gateway"])
]

AUTH_USER_MODEL = 'farmers.Farmer'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "seaweed-api-cache",
        "TIMEOUT": 300,
    }
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

MIDDLEWARE = [
=======
    
    # Packaged zilizoongezwa
    'rest_framework',
    'corsheaders',  # Hii inaruhusu mawasiliano ya Frontend na Backend
    
    # App yako ya wakulima
    'farmers', 
]

# Middlewares (Mpangilio ni muhimu sana hapa)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Lazima iwe juu kabisa kabla ya CommonMiddleware
>>>>>>> 36422b4 (Initial commit for main branch)
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

<<<<<<< HEAD
ROOT_URLCONF = f'seaweed_system.service_urls.{SERVICE_NAME}'
=======
ROOT_URLCONF = 'seaweed_system.urls'  # Badilisha 'backend' kulingana na jina la folder lako kuu kama ni tofauti
>>>>>>> 36422b4 (Initial commit for main branch)

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
<<<<<<< HEAD
=======
                'django.template.context_processors.debug',
>>>>>>> 36422b4 (Initial commit for main branch)
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'seaweed_system.wsgi.application'

<<<<<<< HEAD
# Databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DEFAULT_DB", "seaweed_gateway_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "12345"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "farmers": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("FARMERS_DB", "farmers_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "12345"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "production": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("PRODUCTION_DB", "production_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "12345"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "market": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("MARKET_DB", "market_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "12345"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "inventory": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("INVENTORY_DB", "inventory_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "12345"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "reports": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("REPORTS_DB", "reports_db"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "12345"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
}

DATABASE_ROUTERS = ['seaweed_system.routers.MicroserviceDatabaseRouter']

=======
# Database configuration (SQLite kwa sasa)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'seaweed_db',          # Jina la database uliyotengeneza Postgres
        'USER': 'postgres',            # Username ya Postgres (kawaida ni postgres)
        'PASSWORD': '12345',   # Password uliyoweka wakati unainstall Postgres
        'HOST': 'localhost',           # Njia ya kompyuta yako
        'PORT': '5432',                # Port ya Postgres (kawaida ni 5432)
    }
}

# Password validation
>>>>>>> 36422b4 (Initial commit for main branch)
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

<<<<<<< HEAD
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
=======
# Lugha na Saa
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- MIPANGILIO YA CORS (HAPA NDIPO PANAPORUHUSU FRONTEND YAKO) ---
CORS_ALLOW_ALL_ORIGINS = True  # Inaruhusu Frontend yoyote kuwasiliana na API yako wakati wa utengenezaji

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}
>>>>>>> 36422b4 (Initial commit for main branch)
