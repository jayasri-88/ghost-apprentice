import httpx

from app.core.config import MODEL_NAME, OLLAMA_URL

SYSTEM_PROMPT = """
You are Ghost Apprentice, an AI technician assistant.

Answer the apprentice's question using ONLY the
information available in the provided knowledge manual.

RULES:
- Never invent repair procedures.
- Never invent voltage or torque specifications.
- Never invent safety instructions.
- If information is unavailable, clearly say so.
- Keep answers simple and understandable.

KNOWLEDGE MANUAL:
{manual_context}

APPRENTICE QUESTION:
{question}
"""


def chat_with_ollama(question: str, manual_context: str):
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": SYSTEM_PROMPT.format(
                    manual_context=manual_context, question=question
                ),
            }
        ],
        "stream": False,
    }

    try:
        response = httpx.post(OLLAMA_URL, json=payload, timeout=180.0)
        response.raise_for_status()
        return response.json()["message"]["content"]
    except httpx.TimeoutException:
        raise RuntimeError("Ollama response timed out")
    except httpx.HTTPError as error:
        raise RuntimeError(f"Ollama connection failed: {error}")
