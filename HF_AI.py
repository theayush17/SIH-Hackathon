import os
import re
import json
import time
import random
from typing import List, Optional, Dict, Any

import requests
import chromadb
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# =============================== Env & App ===============================
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- RAG config
CHROMA_PATH = os.getenv("CHROMA_PATH", "./Sikkim_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "Sikkim")
TOP_K = int(os.getenv("TOP_K", "3"))

# ---- Hugging Face Inference API
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN not set in .env")

HF_PROVIDER = os.getenv("HF_PROVIDER", "novita")
HF_MODEL = os.getenv("HF_MODEL", "openai/gpt-oss-120b")

client = InferenceClient(provider=HF_PROVIDER, api_key=HF_TOKEN)

# =============================== Models ===============================
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class StructuredReply(BaseModel):
    summary: Optional[str] = Field(default=None)
    key_points: Optional[List[str]] = Field(default=None)
    steps: Optional[List[str]] = Field(default=None)
    caveats: Optional[List[str]] = Field(default=None)
    comparison_table: Optional[List[List[str]]] = Field(default=None)
    conclusion: Optional[str] = Field(default=None)

class ChatResponse(BaseModel):
    reply: str
    raw_json: Optional[StructuredReply] = None
    meta: Dict[str, Any]

# =============================== Small helpers ===============================
ALLOWED_ROLES = {"system", "user", "assistant"}
MAX_HISTORY_CHARS = 8000

def trim_history(messages: List[Dict[str, str]], budget: int = MAX_HISTORY_CHARS) -> List[Dict[str, str]]:
    total = 0
    kept = []
    for m in reversed(messages):
        chunk = f"{m.get('role','')}: {m.get('content','')}"
        total += len(chunk)
        if total > budget:
            break
        kept.append(m)
    return list(reversed(kept))

def validate_roles(messages: List[Dict[str, str]]) -> None:
    for m in messages:
        if m.get("role") not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role: {m.get('role')}")

# =============================== Small talk detection ===============================
CHITCHAT_REGEX = re.compile(r'\b(hi|hello|hey|yo|sup|good\s*morn|good\s*even|how\s*are\s*you)\b', re.I)
SMALLTALK_REPLIES = [
    "Hey! 👋 How can I help you today?",
    "Hello! 😊 What can I do for you?",
    "Hi there! Need ideas, steps, or a quick explanation?",
    "I’m here! Ask me anything — I’ll keep it tidy and structured."
]

def is_chitchat(text: str) -> bool:
    return bool(CHITCHAT_REGEX.search(text or ""))

def smalltalk_reply() -> str:
    return random.choice(SMALLTALK_REPLIES)

# =============================== Embeddings ===============================
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://127.0.0.1:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "embeddinggemma:latest")

def embed_with_ollama(texts: List[str]) -> List[List[float]]:
    out = []
    for t in texts:
        try:
            r = requests.post(
                f"{OLLAMA_BASE}/api/embeddings",
                headers={"Content-Type": "application/json"},
                json={"model": OLLAMA_EMBED_MODEL, "prompt": t},
                timeout=15,
            )
            r.raise_for_status()
            out.append(r.json()["embedding"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama API error: {e}")
    return out

def embed_query(texts: List[str]) -> List[List[float]]:
    return embed_with_ollama(texts)

# =============================== Retrieval ===============================
def get_collection():
    client_chroma = chromadb.PersistentClient(path=CHROMA_PATH)
    return client_chroma.get_or_create_collection(name=COLLECTION_NAME)

def retrieve_context(user_input: str, k: int = TOP_K) -> Dict[str, Any]:
    q_emb = embed_query([user_input])[0]
    coll = get_collection()
    res = coll.query(
        query_embeddings=[q_emb],
        n_results=k,
        include=["documents", "metadatas", "distances"]
    )
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0] if "metadatas" in res else [None]*len(docs)
    parts = []
    for d, m in zip(docs, metas):
        if isinstance(m, dict) and m:
            meta_info = " ".join(f"{k}:{v}" for k, v in m.items())
            parts.append(f"{d}\n[{meta_info}]")
        else:
            parts.append(d)
    return {
        "context_text": "\n\n---\n\n".join(parts),
        "count": len(docs)
    }

# =============================== Generation (Hugging Face) ===============================
def chat_generate(prompt: str, temperature: float = 0.3, max_tokens: int = 1024) -> str:
    completion = client.chat.completions.create(
        model=HF_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant. "
                    "Use only the given context; if insufficient, say so. "
                    "Always reply in the same language AND script as the user input. "
                    "If the user mixes English and Hindi in Latin letters (Hinglish), continue in Hinglish (Latin). "
                    "Do not transliterate or change the script."
                )
            },
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return completion.choices[0].message["content"].strip()

# =============================== Endpoint ===============================
PLAIN_SYSTEM = (
    "You are a helpful, natural, conversational assistant that follows a consistent writing format.\n"
    "- Always reply in the same language AND script as the user input.\n"
    "- Reply in plain language (no JSON/markdown).\n"
    "- Start with a one-sentence summary.\n"
    "- Provide 2–6 short supporting lines (each on its own line).\n"
    "- End with a one-line concise conclusion.\n"
    "- Keep tone friendly and professional.\n"
)

FRIENDLY_FALLBACK = "I’m here! 😊 How can I help you today?"

@app.post("/chat", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    mode: str = Query(default="json", enum=["json", "markdown"]),
) -> ChatResponse:
    t0 = time.perf_counter()

    messages = [m.dict() for m in chat_request.messages]
    if not messages:
        raise HTTPException(status_code=400, detail="Empty messages are not allowed")

    validate_roles(messages)
    messages = trim_history(messages)
    user_input = messages[-1]["content"]

    if is_chitchat(user_input):
        meta = {
            "model": HF_MODEL,
            "mode": mode,
            "provider": HF_PROVIDER,
            "source": "smalltalk",
            "t_ms": int((time.perf_counter() - t0) * 1000),
        }
        return ChatResponse(reply=smalltalk_reply(), raw_json=None, meta=meta)

    try:
        retrieval = retrieve_context(user_input, k=TOP_K)
        context_text = retrieval["context_text"]
        retrieved_count = retrieval["count"]
    except Exception:
        context_text = ""
        retrieved_count = 0

    prompt = (
        f"{PLAIN_SYSTEM}\n"
        "Answer using ONLY the context below. If the context doesn't contain the answer, say you don't have enough information.\n\n"
        f"Context:\n{context_text if context_text else '(no relevant context found)'}\n\n"
        f"Question: {user_input}\n\n"
        "Answer:"
    )

    try:
        reply = chat_generate(prompt)
        if not reply:
            reply = FRIENDLY_FALLBACK
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HuggingFace API error: {e}") from e

    meta = {
        "model": HF_MODEL,
        "mode": mode,
        "provider": HF_PROVIDER,
        "source": "llm",
        "t_ms": int((time.perf_counter() - t0) * 1000),
        "retrieved_count": retrieved_count,
    }

    return ChatResponse(reply=reply, raw_json=None, meta=meta)
