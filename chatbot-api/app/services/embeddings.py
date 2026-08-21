from openai import OpenAI
from app.config import get_settings


settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)


def get_embedding(text: str) -> list[float]:
    """Generate embedding for a text string."""
    response = client.embeddings.create(
        model=settings.embedding_model,
        input=text,
    )
    return response.data[0].embedding


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts."""
    response = client.embeddings.create(
        model=settings.embedding_model,
        input=texts,
    )
    return [item.embedding for item in response.data]
