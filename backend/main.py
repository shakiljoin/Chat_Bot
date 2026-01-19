from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from typing import List, Literal
from dotenv import load_dotenv

from openai import OpenAI
from sse_starlette.sse import EventSourceResponse
import os, json

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# ✅ optional - safe
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------ models ------------
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

# ------------ API ------------
@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/chat-stream")
def chat_stream(req: ChatRequest):
    messages = [{"role": "system", "content": "You are a helpful assistant."}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    def event_generator():
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.9,
            stream=True
        )

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield {"event": "message", "data": json.dumps({"token": delta.content})}

        yield {"event": "done", "data": "DONE"}

    return EventSourceResponse(event_generator())

# ------------ Frontend serve ------------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/")
    def index():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    # React router support
    @app.get("/{path:path}")
    def spa(path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
