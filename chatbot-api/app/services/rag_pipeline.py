from openai import OpenAI
from app.config import get_settings
from app.services.embeddings import get_embedding
from app.services.qdrant_store import get_qdrant_client, search_similar


settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)
qdrant = get_qdrant_client()

SYSTEM_PROMPT = """You are an AI teaching assistant for the "Physical AI & Humanoid Robotics" textbook by Panaversity. Your role is to help students understand course concepts.

Rules:
1. Answer questions based ONLY on the provided context from the textbook.
2. If the context doesn't contain the answer, say "I don't have information about that in the textbook. Please check the relevant chapter."
3. Be concise but thorough. Use code examples when relevant.
4. Reference specific chapters or sections when possible.
5. Use a professional, educational tone.
6. Format responses with markdown for readability."""

SELECTED_TEXT_PROMPT = """You are an AI teaching assistant. The student has selected the following text from the textbook and wants to understand it better.

Selected text:
---
{selected_text}
---

Help explain this content clearly. You may use the additional context provided to give a more comprehensive answer."""


def retrieve_context(query: str, top_k: int = 5) -> str:
    """Retrieve relevant context from the vector store."""
    query_embedding = get_embedding(query)
    results = search_similar(qdrant, query_embedding, top_k=top_k)

    if not results:
        return "No relevant context found in the textbook."

    context_parts = []
    for i, result in enumerate(results, 1):
        source = result.get("title", result.get("source", "Unknown"))
        context_parts.append(
            f"[Source {i}: {source}]\n{result['text']}"
        )

    return "\n\n---\n\n".join(context_parts)


def generate_response(
    question: str,
    chat_history: list[dict] | None = None,
    selected_text: str | None = None,
):
    """
    Generate a RAG response.

    Args:
        question: The user's question
        chat_history: Previous messages for context
        selected_text: Optional text the user selected on the page
    
    Yields:
        Streamed response chunks
    """
    # Retrieve relevant context
    context = retrieve_context(question)

    # Build messages
    if selected_text:
        system_msg = SELECTED_TEXT_PROMPT.format(selected_text=selected_text)
    else:
        system_msg = SYSTEM_PROMPT

    messages = [
        {"role": "system", "content": system_msg},
        {
            "role": "user",
            "content": f"Context from the textbook:\n\n{context}\n\n---\n\nStudent question: {question}",
        },
    ]

    # Include chat history if provided
    if chat_history:
        # Insert history before the current question
        for msg in chat_history[-6:]:  # Last 3 exchanges
            messages.insert(1, msg)

    # Stream response
    stream = client.chat.completions.create(
        model=settings.chat_model,
        messages=messages,
        stream=True,
        temperature=0.3,
        max_tokens=1024,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def translate_text(text: str, target_language: str = "Urdu"):
    """
    Generate an AI translation of the given text.
    
    Args:
        text: The text to translate
        target_language: The target language
        
    Yields:
        Streamed response chunks
    """
    system_msg = f"You are a professional technical translator. Translate the following educational text into natural, accurate {target_language}. Preserve all formatting, technical terms (you may keep them in English if they don't have a direct common translation), and markdown structure. Provide ONLY the translated text, without any introductory conversational filler."
    
    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": text},
    ]

    stream = client.chat.completions.create(
        model=settings.chat_model,
        messages=messages,
        stream=True,
        temperature=0.3,
        max_tokens=4096,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
