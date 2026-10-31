from fastapi import APIRouter, HTTPException

from app.core.config import MODEL_NAME
from app.schemas.chat import ChatRequest
from app.services.ollama_service import chat_with_ollama

router = APIRouter()


@router.post("/chat")
def assistant_chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if not request.manual_context.strip():
        raise HTTPException(
            status_code=400, detail="Knowledge manual context is required"
        )

    try:
        answer = chat_with_ollama(request.question, request.manual_context)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))

    return {"question": request.question, "answer": answer, "model": MODEL_NAME}