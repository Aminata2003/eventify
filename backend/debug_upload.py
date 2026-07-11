import json
import pathlib
import requests

BASE = 'http://127.0.0.1:8000/api'

s = requests.Session()
resp = s.post(BASE + '/auth/login/', json={'username': 'debugorg@example.com', 'password': 'Debug123'})
print('login', resp.status_code, resp.text)
if resp.status_code != 200:
    resp = s.post(BASE + '/auth/register/organizer/', json={'name': 'Debug Organizer', 'email': 'debugorg@example.com', 'password': 'Debug123', 'role': 'organizer'})
    print('register', resp.status_code, resp.text)
    resp = s.post(BASE + '/auth/login/', json={'username': 'debugorg@example.com', 'password': 'Debug123'})
    print('login2', resp.status_code, resp.text)

if resp.status_code != 200:
    raise SystemExit('auth failed')

token = resp.json()['access']
headers = {'Authorization': f'Bearer {token}'}

f = pathlib.Path('test.jpg')
f.write_bytes(b'fakeimage')

# Send as multipart/form-data similar to browser file upload
with f.open('rb') as fh:
    data = {
        'title': 'Test event 400',
        'description': 'Test description',
        'category': 'Musique',
        'date': '2026-12-01',
        'time': '18:00:00',
        'location': 'Dakar',
        'venue': 'Test venue',
        'is_public': 'true',
        'allowed_users': json.dumps(['a@b.com']),
        'places': '100',
        'price': '1000.00',
        'price_currency': 'FCFA',
    }
    files = {'image': ('test.jpg', fh, 'image/jpeg')}
    r = s.post(BASE + '/events/', headers=headers, data=data, files=files)
    print('create', r.status_code)
    print(r.text)
