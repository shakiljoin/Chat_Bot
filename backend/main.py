from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal
from dotenv import load_dotenv
from openai import OpenAI
from sse_starlette.sse import EventSourceResponse
import os, json

# ✅ Load API KEY from .env
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
print("✅ OPENAI_API_KEY FOUND:", bool(OPENAI_API_KEY))

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]  # ✅ full chat history

@app.post("/chat-stream")
def chat_stream(req: ChatRequest):

    # ✅ Strong system prompt (ChatGPT style)
    messages = [
        {
            "role": "system",
            "content": (
                "You are ChatGPT, a helpful assistant. "
                "Use markdown formatting, be clear, friendly, and detailed."
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

        yield {"event": "done", "data": "DONE"}

    return EventSourceResponse(event_generator())
