import base64
import hashlib
import io
import json
import os
import re
import time
import uuid
from datetime import datetime
from pathlib import Path

from flask import (
    Flask,
    abort,
    jsonify,
    make_response,
    redirect,
    request,
    send_from_directory,
)
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
DRAFT_UPLOAD_DIR = UPLOAD_DIR / "drafts"
DATA_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)
DRAFT_UPLOAD_DIR.mkdir(exist_ok=True)

TEXTURES_FILE = DATA_DIR / "textures.json"
DRAFTS_FILE = DATA_DIR / "drafts.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"

for path, default in [
    (TEXTURES_FILE, []),
    (DRAFTS_FILE, []),
    (SESSIONS_FILE, {}),
]:
    if not path.exists():
        path.write_text(json.dumps(default, indent=2), encoding="utf-8")

CREATE_PASSWORD = os.getenv("CREATE_PASSWORD")
CREATE_PASSWORD_HASH = os.getenv("CREATE_PASSWORD_HASH")
SECRET_KEY = os.getenv("FLASK_SECRET_KEY") or os.getenv("SECRET_KEY") or uuid.uuid4().hex
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", 2048))
CREATE_AUTH_DURATION_SECONDS = int(os.getenv("CREATE_AUTH_DURATION_SECONDS", 30 * 60))
SESSION_COOKIE = "evoblox_session"
ALLOWED_IMAGE_FORMATS = {"PNG", "JPEG", "JPG", "WEBP"}
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.config["SECRET_KEY"] = SECRET_KEY


def load_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password):
    if CREATE_PASSWORD_HASH:
        return hash_password(password) == CREATE_PASSWORD_HASH
    if CREATE_PASSWORD:
        return password == CREATE_PASSWORD
    return False


def create_session_if_missing():
    sessions = load_json(SESSIONS_FILE, {})
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id or session_id not in sessions:
        session_id = uuid.uuid4().hex
        sessions[session_id] = {
            "created_at": time.time(),
            "authorized_until": 0,
            "creator_username": "Guest",
            "creator_id": session_id,
            "created_textures": [],
            "draft_ids": [],
        }
        save_json(SESSIONS_FILE, sessions)
    return session_id, sessions, sessions[session_id]


def save_sessions(sessions):
    save_json(SESSIONS_FILE, sessions)


def get_session_data():
    session_id, sessions, session_obj = create_session_if_missing()
    if session_obj.get("authorized_until", 0) > time.time():
        return session_id, session_obj, True
    return session_id, session_obj, False


def make_session_response(payload, session_id):
    response = make_response(jsonify(payload))
    response.set_cookie(
        SESSION_COOKIE,
        session_id,
        httponly=True,
        samesite="Lax",
        secure=False,
        max_age=30 * 24 * 3600,
        path="/",
    )
    return response


def save_image_bytes(image_bytes, filename):
    path = UPLOAD_DIR / f"{filename}.png"
    with path.open("wb") as f:
        f.write(image_bytes)
    return str(path.name)


def save_draft_image_bytes(image_bytes, filename):
    path = DRAFT_UPLOAD_DIR / f"{filename}.png"
    with path.open("wb") as f:
        f.write(image_bytes)
    return f"drafts/{path.name}"


def parse_image_data(data_url):
    if not isinstance(data_url, str) or "," not in data_url:
        raise ValueError("Invalid image data format.")
    header, encoded = data_url.split(",", 1)
    if not header.startswith("data:image/"):
        raise ValueError("Unsupported image format.")
    match = re.match(r"data:image/(png|jpeg|jpg|webp);base64", header)
    if not match:
        raise ValueError("Unsupported image MIME type.")
    image_bytes = base64.b64decode(encoded)
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise ValueError("Image size exceeds the maximum allowed limit.")
    return image_bytes


def validate_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        raise ValueError("Uploaded image is invalid or unsupported.")
    if image.format.upper() not in ALLOWED_IMAGE_FORMATS:
        raise ValueError("Uploaded image format is not allowed.")
    if image.width > MAX_IMAGE_DIMENSION or image.height > MAX_IMAGE_DIMENSION:
        raise ValueError("Uploaded image dimensions are too large.")
    return image


def current_timestamp():
    return datetime.utcnow().isoformat() + "Z"


def load_textures():
    return load_json(TEXTURES_FILE, [])


def save_textures(textures):
    save_json(TEXTURES_FILE, textures)


def load_drafts():
    return load_json(DRAFTS_FILE, [])


def save_drafts(drafts):
    save_json(DRAFTS_FILE, drafts)


def find_texture(texture_id):
    textures = load_textures()
    for texture in textures:
        if texture.get("id") == texture_id:
            return texture
    return None


def find_draft(draft_id):
    drafts = load_drafts()
    for draft in drafts:
        if draft.get("id") == draft_id:
            return draft
    return None


def require_authorized():
    session_id, session_obj, authorized = get_session_data()
    if not authorized:
        abort(401, description="Create access is required.")
    return session_id, session_obj


@app.route("/api/create/session", methods=["GET"])
def api_create_session():
    session_id, session_obj, authorized = get_session_data()
    payload = {
        "authorized": authorized,
        "expiresAt": int(session_obj.get("authorized_until", 0)),
    }
    return make_session_response(payload, session_id)


@app.route("/api/create/authorize", methods=["POST"])
def api_create_authorize():
    session_id, sessions, session_obj = create_session_if_missing()
    body = request.get_json(silent=True) or {}
    password = body.get("password", "")
    if not password:
        return make_session_response(
            {"authorized": False, "message": "Password is required."},
            session_id,
        )
    if not verify_password(password):
        return make_session_response(
            {"authorized": False, "message": "Incorrect password."},
            session_id,
        )
    session_obj["authorized_until"] = int(time.time()) + CREATE_AUTH_DURATION_SECONDS
    sessions[session_id] = session_obj
    save_sessions(sessions)
    payload = {
        "authorized": True,
        "expiresAt": session_obj["authorized_until"],
    }
    return make_session_response(payload, session_id)


@app.route("/api/create/revoke", methods=["POST"])
def api_create_revoke():
    session_id, sessions, session_obj = create_session_if_missing()
    session_obj["authorized_until"] = 0
    sessions[session_id] = session_obj
    save_sessions(sessions)
    payload = {"revoked": True}
    return make_session_response(payload, session_id)


@app.route("/api/published-textures", methods=["GET"])
def api_published_textures():
    textures = load_textures()
    for texture in textures:
        texture["image_url"] = f"/uploads/{texture['image_filename']}"
    return jsonify(textures)


@app.route("/api/my-textures", methods=["GET"])
def api_my_textures():
    session_id, session_obj, authorized = get_session_data()
    textures = load_textures()
    my_textures = [
        {
            **texture,
            "image_url": f"/uploads/{texture['image_filename']}",
        }
        for texture in textures
        if texture.get("creator_id") == session_id
    ]
    drafts = load_drafts()
    my_drafts = [
        {
            **draft,
            "image_url": f"/uploads/{draft['image_filename']}",
        }
        for draft in drafts
        if draft.get("creator_id") == session_id
    ]
    return make_session_response({"textures": my_textures, "drafts": my_drafts, "authorized": authorized}, session_id)


@app.route("/api/drafts", methods=["GET", "POST"])
def api_drafts():
    session_id, session_obj, authorized = get_session_data()
    if request.method == "GET":
        drafts = load_drafts()
        my_drafts = [
            {
                **draft,
                "image_url": f"/uploads/{draft['image_filename']}",
            }
            for draft in drafts
            if draft.get("creator_id") == session_id
        ]
        return make_session_response({"drafts": my_drafts}, session_id)

    body = request.get_json(silent=True) or {}
    name = body.get("name", "Untitled Draft").strip()
    image_data = body.get("imageData")
    if not image_data:
        abort(400, description="Draft image data is required.")
    try:
        raw_bytes = parse_image_data(image_data)
        validate_image(raw_bytes)
    except ValueError as exc:
        abort(400, description=str(exc))
    draft_id = body.get("id") or uuid.uuid4().hex
    image_filename = save_draft_image_bytes(raw_bytes, draft_id)
    drafts = load_drafts()
    existing = next((item for item in drafts if item.get("id") == draft_id), None)
    draft_entry = {
        "id": draft_id,
        "creator_id": session_id,
        "creator_username": session_obj.get("creator_username", "Guest"),
        "name": name,
        "description": body.get("description", ""),
        "category": body.get("category", ""),
        "tags": body.get("tags", ""),
        "image_filename": image_filename,
        "updated_at": current_timestamp(),
        "created_at": existing.get("created_at") if existing else current_timestamp(),
    }
    if existing:
        drafts = [draft_entry if draft.get("id") == draft_id else draft for draft in drafts]
    else:
        drafts.append(draft_entry)
        session_obj.setdefault("draft_ids", []).append(draft_id)
        sessions = load_json(SESSIONS_FILE, {})
        sessions[session_id] = session_obj
        save_sessions(sessions)
    save_drafts(drafts)
    return make_session_response({"draft": draft_entry}, session_id)


@app.route("/api/textures", methods=["POST"])
def api_publish_texture():
    session_id, session_obj = require_authorized()
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()
    description = body.get("description", "").strip()
    category = body.get("category", "").strip()
    tags = body.get("tags", "").strip()
    image_data = body.get("imageData")
    if not name or not description or not category or not tags or not image_data:
        abort(400, description="All publish fields are required.")
    if category not in ["Player", "Community", "Premium"]:
        abort(400, description="Invalid category.")
    try:
        raw_bytes = parse_image_data(image_data)
        validate_image(raw_bytes)
    except ValueError as exc:
        abort(400, description=str(exc))
    texture_id = uuid.uuid4().hex
    image_filename = save_image_bytes(raw_bytes, texture_id)
    textures = load_textures()
    record = {
        "id": texture_id,
        "creator_id": session_id,
        "creator_username": session_obj.get("creator_username", "Guest"),
        "name": name,
        "description": description,
        "category": category,
        "tags": [tag.strip() for tag in tags.split(",") if tag.strip()],
        "image_filename": image_filename,
        "created_at": current_timestamp(),
        "updated_at": current_timestamp(),
    }
    textures.append(record)
    save_textures(textures)
    session_obj.setdefault("created_textures", []).append(texture_id)
    sessions = load_json(SESSIONS_FILE, {})
    sessions[session_id] = session_obj
    save_sessions(sessions)
    payload = {
        "id": texture_id,
        "url": f"/texture/{texture_id}",
    }
    return make_session_response(payload, session_id)


@app.route("/api/textures/<texture_id>", methods=["GET", "PATCH", "DELETE"])
def api_texture_item(texture_id):
    session_id, session_obj, authorized = get_session_data()
    textures = load_textures()
    texture = next((item for item in textures if item.get("id") == texture_id), None)
    if not texture:
        abort(404, description="Texture not found.")
    if request.method == "GET":
        return jsonify({
            **texture,
            "image_url": f"/uploads/{texture['image_filename']}",
        })

    if texture.get("creator_id") != session_id:
        abort(403, description="You do not have permission to modify this texture.")

    if request.method == "PATCH":
        body = request.get_json(silent=True) or {}
        if "name" in body:
            texture["name"] = body.get("name", texture["name"]).strip()
        if "description" in body:
            texture["description"] = body.get("description", texture["description"]).strip()
        if "category" in body:
            texture["category"] = body.get("category", texture["category"]).strip()
        if "tags" in body:
            texture["tags"] = [tag.strip() for tag in body.get("tags", texture.get("tags", [])).split(",") if tag.strip()]
        if "imageData" in body and body.get("imageData"):
            try:
                raw_bytes = parse_image_data(body.get("imageData"))
                validate_image(raw_bytes)
            except ValueError as exc:
                abort(400, description=str(exc))
            save_image_bytes(raw_bytes, texture_id)
        texture["updated_at"] = current_timestamp()
        save_textures(textures)
        return jsonify({"updated": True, "id": texture_id})

    if request.method == "DELETE":
        textures = [item for item in textures if item.get("id") != texture_id]
        save_textures(textures)
        file_path = UPLOAD_DIR / f"{texture_id}.png"
        if file_path.exists():
            file_path.unlink()
        return jsonify({"deleted": True})


@app.route("/uploads/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/texture/<texture_id>")
def texture_page(texture_id):
    texture = find_texture(texture_id)
    if not texture:
        return "Texture not found.", 404
    image_url = f"/uploads/{texture['image_filename']}"
    tags = ", ".join(texture.get("tags", []))
    html = """<!DOCTYPE html>
<html lang='ro'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<title>{name} - Evoblox</title>
<style>
body {{ margin: 0; background: #111; color: #fff; font-family: Arial, sans-serif; }}
.container {{ padding: 24px; max-width: 1024px; margin: auto; }}
.card {{ background: #181818; border: 1px solid #333; border-radius: 14px; padding: 24px; }}
img {{ max-width: 100%; border-radius: 12px; background: #000; }}
.button {{ display: inline-block; margin-top: 12px; padding: 10px 16px; background: #2f8; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; }}
.meta {{ margin-top: 18px; color: #aaa; }}
.meta div {{ margin-top: 8px; }}
</style>
</head>
<body>
<div class='container'>
<div class='card'>
<h1>{name}</h1>
<img src='{image_url}' alt='{name}'>
<p>{description}</p>
<div class='meta'>
<div><strong>Creator:</strong> {creator_username}</div>
<div><strong>Category:</strong> {category}</div>
<div><strong>Tags:</strong> {tags}</div>
<div><strong>Published:</strong> {created_at}</div>
<div><strong>Texture ID:</strong> {texture_id}</div>
</div>
<a class='button' href='{image_url}' download>Download</a>
<a class='button' href='/'>Back to library</a>
</div>
</div>
</body>
</html>"""
    return html.format(
        name=texture['name'],
        image_url=image_url,
        description=texture['description'],
        creator_username=texture['creator_username'],
        category=texture['category'],
        tags=tags,
        created_at=texture['created_at'],
        texture_id=texture['id'],
    )


@app.route("/")
def index_page():
    return app.send_static_file("index.html")


@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": str(error.description or "Bad request.")}), 400


@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": str(error.description or "Unauthorized.")}), 401


@app.errorhandler(403)
def forbidden(error):
    return jsonify({"error": str(error.description or "Forbidden.")}), 403


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": str(error.description or "Not found.")}), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
