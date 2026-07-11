import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8000/api'


def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            print('OK', resp.status)
            print(body)
            return json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        print('ERROR', e.code)
        print(body)
        return None


login = post(
    f'{BASE}/auth/login/',
    {'username': 'testorg@example.com', 'password': 'Aa123456'}
)
if not login:
    print('Registering new organizer...')
    post(
        f'{BASE}/auth/register/organizer/',
        {'name': 'Debug Organizer', 'email': 'debugorg@example.com', 'password': 'Aa123456'}
    )
    login = post(
        f'{BASE}/auth/login/',
        {'username': 'debugorg@example.com', 'password': 'Aa123456'}
    )

if not login:
    raise SystemExit('Could not obtain token')

token = login['access']
print('token obtained')

payload = {
    'title': 'Test event 400',
    'description': 'Test description',
    'category': 'Musique',
    'date': '2026-12-01',
    'time': '18:00:00',
    'location': 'Dakar',
    'venue': 'Test venue',
    'image': 'https://example.com/image.jpg',
    'is_public': True,
    'allowed_users': [],
    'places': 100,
    'price': 1000,
    'price_currency': 'FCFA',
}

print('Creating event...')
post(f'{BASE}/events/', payload, token)
