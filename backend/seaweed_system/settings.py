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
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Packaged zilizoongezwa
    'rest_framework',
    'corsheaders',  # Hii inaruhusu mawasiliano ya Frontend na Backend
    
    # App yako ya wakulima
    'farmers', 
]

# Middlewares (Mpangilio ni muhimu sana hapa)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Lazima iwe juu kabisa kabla ya CommonMiddleware
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'seaweed_system.urls'  # Badilisha 'backend' kulingana na jina la folder lako kuu kama ni tofauti

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'seaweed_system.wsgi.application'

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
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

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
