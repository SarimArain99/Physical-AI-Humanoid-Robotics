from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.config import get_settings
import uuid


settings = get_settings()


def get_qdrant_client() -> QdrantClient:
    """Create Qdrant client connected to cloud instance."""
    if settings.qdrant_url and settings.qdrant_api_key:
        return QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
    # Fallback: in-memory for development without cloud
    return QdrantClient(":memory:")


def ensure_collection(client: QdrantClient, dimension: int = 1536):
    """Create the collection if it doesn't exist."""
    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection_name not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection_name,
            vectors_config=VectorParams(
                size=dimension,
                distance=Distance.COSINE,
            ),
        )


def upsert_chunks(
    client: QdrantClient,
    chunks: list[dict],
    embeddings: list[list[float]],
):
    """
    Upsert text chunks with their embeddings into Qdrant.

    Each chunk dict should have: text, source, title
    """
    points = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "text": chunk["text"],
                    "source": chunk.get("source", ""),
                    "title": chunk.get("title", ""),
                    "chunk_index": i,
                },
            )
        )

    # Batch upsert (100 at a time)
    batch_size = 100
    for i in range(0, len(points), batch_size):
        client.upsert(
            collection_name=settings.qdrant_collection_name,
            points=points[i : i + batch_size],
        )


def search_similar(
    client: QdrantClient,
    query_embedding: list[float],
    top_k: int = 5,
    source_filter: str | None = None,
) -> list[dict]:
    """Search for similar chunks in the vector store."""
    search_filter = None
    if source_filter:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="source",
                    match=MatchValue(value=source_filter),
                )
            ]
        )

    results = client.search(
        collection_name=settings.qdrant_collection_name,
        query_vector=query_embedding,
        limit=top_k,
        query_filter=search_filter,
    )

    return [
        {
            "text": hit.payload["text"],
            "source": hit.payload.get("source", ""),
            "title": hit.payload.get("title", ""),
            "score": hit.score,
        }
        for hit in results
    ]
