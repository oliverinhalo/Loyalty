# LoyaltyCard

A loyalty points system with a FastAPI backend, web UI, and Kivy mobile app.

## Project structure

```
loyalty/
├── api/
│   ├── server.py              ← FastAPI app (web UI + JSON API)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── templates/
│       ├── index.html         ← card lookup page
│       └── card.html          ← dashboard
├── kivy/
│   ├── loyalty_app.py         ← Android/desktop Kivy app
│   └── loyalty_config.json    ← configure URL + API key here
├── data/                      ← SQLite database lives here (auto-created)
└── docker-compose.yml
```

---

## Setup with Docker (recommended)

### 1. Install Docker
Download from https://docs.docker.com/get-docker/ — one installer, works on Windows/Mac/Linux.

### 2. Set your API key
Open `docker-compose.yml` and change:
```yaml
- API_KEY=change-me-in-production
```
to something secret. This key is required for all write operations (add, remove, set, reset).

### 3. Start the server
```bash
cd loyalty
docker compose up --build
```

That's it. The server is now running at http://localhost:5000

- Web UI:  http://localhost:5000
- API docs: http://localhost:5000/docs   (FastAPI auto-generates this)

The database file is saved to `./data/cards.db` on your machine, so it survives restarts.

### 4. Stop the server
```bash
docker compose down
```

---

## Running without Docker (development)

```bash
cd api
pip install -r requirements.txt
API_KEY=yourkey DB_PATH=../data/cards.db uvicorn server:app --reload --port 5000
```

---

## Kivy app setup

1. Install dependencies:
   ```bash
   pip install kivy requests
   ```

2. Edit `kivy/loyalty_config.json`:
   ```json
   {
       "base_url": "http://YOUR_SERVER_IP:5000",
       "api_key":  "your-secret-key"
   }
   ```
   - On the same machine: use `http://localhost:5000`
   - On your phone (same WiFi): use your PC's local IP, e.g. `http://192.168.1.50:5000`
   - Production: use your domain with HTTPS, e.g. `https://loyalty.yoursite.com`

3. Run:
   ```bash
   python kivy/loyalty_app.py
   ```

---

## API reference

All write endpoints require the header: `X-API-Key: your-key`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/view/{card_id}` | No  | Get card balance |
| POST   | `/add/{card_id}/{points}` | Yes | Add points |
| POST   | `/remove/{card_id}/{points}` | Yes | Remove points (floors at 0) |
| POST   | `/set/{card_id}/{points}` | Yes | Set exact balance |
| PUT    | `/create_card` | Yes | Create a new card |
| GET    | `/transactions/{card_id}` | Yes | Last 50 transactions |

Full interactive docs at http://localhost:5000/docs

---

## Deploying to a real server

1. Put your server behind a reverse proxy (nginx or Caddy) with HTTPS
2. Use a strong random API key: `python -c "import secrets; print(secrets.token_hex(32))"`
3. Change `loyalty_config.json` in the Kivy app to point to your domain
