"""
Ingestion script — reads markdown files from the textbook and indexes them into Qdrant.

Usage:
    cd chatbot-api
    python -m app.scripts.ingest
"""

import os
import re
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.config import get_settings
from app.services.embeddings import get_embeddings_batch
from app.services.qdrant_store import get_qdrant_client, ensure_collection, upsert_chunks

settings = get_settings()

DOCS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "textbook" / "docs"


def read_markdown_files(docs_dir: Path) -> list[dict]:
    """Read all markdown files and extract content with metadata."""
    documents = []

    for md_file in sorted(docs_dir.rglob("*.md")):
        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract title from frontmatter or first heading
        title = ""
        title_match = re.search(r"title:\s*(.+)", content)
        if title_match:
            title = title_match.group(1).strip()
        else:
            heading_match = re.search(r"^#\s+(.+)", content, re.MULTILINE)
            if heading_match:
                title = heading_match.group(1).strip()

        # Remove frontmatter
        content = re.sub(r"^---.*?---\s*", "", content, flags=re.DOTALL)

        # Clean markdown artifacts but keep code blocks
        content = re.sub(r":::.*?\n", "", content)  # Remove admonitions markers

        # Relative path as source
        source = str(md_file.relative_to(docs_dir))

        documents.append({
            "title": title,
            "source": source,
            "content": content.strip(),
        })

    return documents


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks by approximate token count."""
    # Rough approximation: 1 token ≈ 4 characters
    char_chunk_size = chunk_size * 4
    char_overlap = overlap * 4

    chunks = []
    start = 0

    while start < len(text):
        end = start + char_chunk_size

        # Try to break at a paragraph or sentence boundary
        if end < len(text):
            # Look for paragraph break near end
            para_break = text.rfind("\n\n", start + char_chunk_size // 2, end + 200)
            if para_break > start:
                end = para_break
            else:
                # Look for sentence break
                sent_break = text.rfind(". ", start + char_chunk_size // 2, end + 100)
                if sent_break > start:
                    end = sent_break + 1

        chunk = text[start:end].strip()
        if chunk and len(chunk) > 50:  # Skip very short chunks
            chunks.append(chunk)

        start = end - char_overlap

    return chunks


def main():
    """Ingest textbook content into Qdrant."""
    print("=" * 60)
    print("Physical AI Textbook — Content Ingestion")
    print("=" * 60)

    # Check if docs directory exists
    if not DOCS_DIR.exists():
        print(f"ERROR: Docs directory not found: {DOCS_DIR}")
        sys.exit(1)

    # Read documents
    print(f"\n📖 Reading markdown files from: {DOCS_DIR}")
    documents = read_markdown_files(DOCS_DIR)
    print(f"   Found {len(documents)} documents")

    # Chunk documents
    print("\n✂️  Chunking documents...")
    all_chunks = []
    for doc in documents:
        chunks = chunk_text(
            doc["content"],
            chunk_size=settings.chunk_size,
            overlap=settings.chunk_overlap,
        )
        for chunk in chunks:
            all_chunks.append({
                "text": chunk,
                "source": doc["source"],
                "title": doc["title"],
            })

    print(f"   Created {len(all_chunks)} chunks")

    # Generate embeddings
    print(f"\n🧠 Generating embeddings with {settings.embedding_model}...")
    texts = [c["text"] for c in all_chunks]

    # Batch process (max 2048 per request for OpenAI)
    all_embeddings = []
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        embeddings = get_embeddings_batch(batch)
        all_embeddings.extend(embeddings)
        print(f"   Processed {min(i + batch_size, len(texts))}/{len(texts)}")

    # Store in Qdrant
    print(f"\n📦 Storing in Qdrant collection: {settings.qdrant_collection_name}")
    client = get_qdrant_client()
    dimension = len(all_embeddings[0])
    ensure_collection(client, dimension=dimension)
    upsert_chunks(client, all_chunks, all_embeddings)

    print(f"\n✅ Successfully ingested {len(all_chunks)} chunks!")
    print("=" * 60)


if __name__ == "__main__":
    main()
