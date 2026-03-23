"""
Loyalty Card API — FastAPI
Serves JSON endpoints AND the web UI (no separate Flask server needed).

Env vars (set in docker-compose.yml or .env):
    API_KEY      — shared secret for all mutating requests
    DB_PATH      — path to the SQLite database file
"""

import os
import uuid
import sqlite3
from contextlib import contextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Security, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.security.api_key import APIKeyHeader
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY  = os.environ.get("API_KEY", "change-me-in-production")
DB_PATH  = os.environ.get("DB_PATH", "data/cards.db")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

app = FastAPI(title="LoyaltyCard API", version="1.0.0")
templates = Jinja2Templates(directory="templates")

# ── Database ──────────────────────────────────────────────────────────────────
def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # safer concurrent access
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS cards (
                id            TEXT PRIMARY KEY,
                creation_date TEXT NOT NULL,
                points        INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS transactions (
                sale_id    INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id    TEXT    NOT NULL REFERENCES cards(id),
                date       TEXT    NOT NULL,
                delta      INTEGER NOT NULL,
                new_total  INTEGER NOT NULL
            );

            INSERT INTO cards(id, creation_date, points) VALUES (0,datetime('now'),50);
        """)


init_db()

# ── Auth ──────────────────────────────────────────────────────────────────────
def require_api_key(key: str = Security(api_key_header)):
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return key


# ── Helpers ───────────────────────────────────────────────────────────────────
def _fetch_card(conn: sqlite3.Connection, card_id: str) -> sqlite3.Row:
    row = conn.execute(
        "SELECT id, points FROM cards WHERE id = ?", (card_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")
    return row


def _log_transaction(conn: sqlite3.Connection, card_id: str,
                     delta: int, new_total: int):
    conn.execute(
        "INSERT INTO transactions (card_id, date, delta, new_total) VALUES (?,?,?,?)",
        (card_id, datetime.utcnow().isoformat(), delta, new_total)
    )


# ── Web UI ────────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/card/{card_id}", response_class=HTMLResponse)
def card_page(request: Request, card_id: str):
    with get_db() as conn:
        card = _fetch_card(conn, card_id)
    return templates.TemplateResponse("card.html", {
        "request": request,
        "card_id": card["id"],
        "points":  card["points"],
    })


# ── JSON API ──────────────────────────────────────────────────────────────────
@app.get("/view/{card_id}")
def view_card(card_id: str):
    with get_db() as conn:
        card = _fetch_card(conn, card_id)
    return {"status": "success", "card_id": card["id"], "points": card["points"]}


@app.post("/add/{card_id}/{points}")
def add_points(card_id: str, points: int, _=Depends(require_api_key)):
    if points <= 0:
        raise HTTPException(status_code=400, detail="Points must be positive")
    with get_db() as conn:
        card = _fetch_card(conn, card_id)
        new_total = card["points"] + points
        conn.execute("UPDATE cards SET points = ? WHERE id = ?",
                     (new_total, card_id))
        _log_transaction(conn, card_id, +points, new_total)
    return {"status": "success", "points": new_total}


@app.post("/remove/{card_id}/{points}")
def remove_points(card_id: str, points: int, _=Depends(require_api_key)):
    if points <= 0:
        raise HTTPException(status_code=400, detail="Points must be positive")
    with get_db() as conn:
        card = _fetch_card(conn, card_id)
        new_total = max(0, card["points"] - points)
        conn.execute("UPDATE cards SET points = ? WHERE id = ?",
                     (new_total, card_id))
        _log_transaction(conn, card_id, -points, new_total)
    return {"status": "success", "points": new_total}


@app.post("/set/{card_id}/{points}")
def set_points(card_id: str, points: int, _=Depends(require_api_key)):
    if points < 0:
        raise HTTPException(status_code=400, detail="Points cannot be negative")
    with get_db() as conn:
        card = _fetch_card(conn, card_id)
        delta = points - card["points"]
        conn.execute("UPDATE cards SET points = ? WHERE id = ?",
                     (points, card_id))
        _log_transaction(conn, card_id, delta, points)
    return {"status": "success", "points": points}


@app.put("/create_card")
def create_card(_=Depends(require_api_key)):
    card_id = str(uuid.uuid4())[:8].upper()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO cards (id, creation_date, points) VALUES (?,?,?)",
            (card_id, datetime.utcnow().isoformat(), 0)
        )
    return {"status": "success", "card_id": card_id}


@app.get("/transactions/{card_id}")
def get_transactions(card_id: str, _=Depends(require_api_key)):
    with get_db() as conn:
        _fetch_card(conn, card_id)   # 404 if card doesn't exist
        rows = conn.execute(
            "SELECT * FROM transactions WHERE card_id = ? ORDER BY sale_id DESC LIMIT 50",
            (card_id,)
        ).fetchall()
    return {"status": "success", "transactions": [dict(r) for r in rows]}
