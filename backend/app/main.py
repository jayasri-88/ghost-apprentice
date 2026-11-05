from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.assistant_routes import router as assistant_router
from app.api.manual_routes import router as manual_router
from app.api.video_routes import router as video_router
from app.services import manual_store

app = FastAPI(
    title="Ghost Apprentice API",
    description="AI-powered technician knowledge preservation system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_router, prefix="/api/videos", tags=["Videos"])
app.include_router(assistant_router, prefix="/api/assistant", tags=["Ghost Assistant"])
app.include_router(manual_router, prefix="/api/manuals", tags=["Manuals"])

manual_store.init_db()


@app.get("/")
def home():
    return {"message": "Welcome to Ghost Apprentice", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
