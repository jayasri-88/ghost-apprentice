from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    manual_context: str
