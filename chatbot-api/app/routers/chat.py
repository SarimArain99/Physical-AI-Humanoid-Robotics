from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.rag_pipeline import generate_response, translate_text
from app.services.db import get_db, save_message, get_chat_history
import json

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    session_id: str = "default"


class SelectedTextChatRequest(BaseModel):
    """Request body for chat about selected text."""
    message: str
    selected_text: str
    session_id: str = "default"


class TranslateRequest(BaseModel):
    """Request body for translating textbook content."""
    text: str
    target_language: str = "Urdu"


@router.post("/chat")
async def chat(request: ChatRequest, db: AsyncSession | None = Depends(get_db)):
    """
    Send a message and get a streamed RAG response.
    The response is based on the textbook content stored in Qdrant.
    """
    # Get chat history
    history = await get_chat_history(db, request.session_id)

    # Save user message
    await save_message(db, request.session_id, "user", request.message)

    async def stream():
        full_response = []
        for chunk in generate_response(
            question=request.message,
            chat_history=history,
        ):
            full_response.append(chunk)
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        # Save assistant response
        assistant_msg = "".join(full_response)
        await save_message(db, request.session_id, "assistant", assistant_msg)

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/chat/selected")
async def chat_selected(
    request: SelectedTextChatRequest,
    db: AsyncSession | None = Depends(get_db),
):
    """
    Answer a question about user-selected text from the textbook.
    """
    history = await get_chat_history(db, request.session_id)
    await save_message(db, request.session_id, "user", request.message)

    async def stream():
        full_response = []
        for chunk in generate_response(
            question=request.message,
            chat_history=history,
            selected_text=request.selected_text,
        ):
            full_response.append(chunk)
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        assistant_msg = "".join(full_response)
        await save_message(db, request.session_id, "assistant", assistant_msg)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/translate")
async def translate(request: TranslateRequest):
    """
    Translate the provided text into the target language.
    """
    async def stream():
        for chunk in translate_text(
            text=request.text,
            target_language=request.target_language,
        ):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Physical AI Textbook RAG API"}
