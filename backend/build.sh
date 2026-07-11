#!/usr/bin/env bash
# Script de build utilisé par Render pour préparer le backend en production.
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate