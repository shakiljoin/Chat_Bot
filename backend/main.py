from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
from dotenv import load_dotenv
from openai import OpenAI
from sse_starlette.sse import EventSourceResponse
import os, json

# Load .env locally (Render env vars also work)
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
print("✅ OPENAI_API_KEY FOUND:", bool(OPENAI_API_KEY))

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# ✅ CORS (IMPORTANT)
# Use "*" first to confirm it works, then you can lock to vercel domain later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # ✅ no CORS issue
    allow_credentials=False,        # ✅ must be False when "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ models
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]


@app.get("/")
def root():
    return {"status": "ok", "message": "Backend is running ✅"}


# ✅ Fix preflight OPTIONS (very important for /chat-stream)
@app.options("/chat-stream")
def chat_stream_options():
    return Response(status_code=200)


@app.post("/chat-stream")
def chat_stream(req: ChatRequest):
    messages = [
        {
            "role": "system",
            "content": (
                "You are ChatGPT, a helpful assistant. "
                "Use markdown formatting, be clear and friendly."
            )
        }
    ]

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
                yield {
                    "event": "message",
                    "data": json.dumps({"token": delta.content})
                }

        # ✅ stream finished
        yield {"event": "done", "data": "DONE"}

    return EventSourceResponse(event_generator())
