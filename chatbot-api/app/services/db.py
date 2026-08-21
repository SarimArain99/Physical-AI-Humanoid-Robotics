from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, DateTime, func
from datetime import datetime
from app.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    pass


class ChatMessage(Base):
    """Store chat history in Neon Postgres."""

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(20))  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# Database engine and session
engine = None
AsyncSessionLocal = None


async def init_db():
    """Initialize the database connection and create tables."""
    global engine, AsyncSessionLocal

    if not settings.database_url:
        return  # Skip if no database URL configured

    engine = create_async_engine(settings.database_url, echo=False)
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Get database session."""
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        yield session


async def save_message(
    db: AsyncSession | None,
    session_id: str,
    role: str,
    content: str,
):
    """Save a chat message to the database."""
    if db is None:
        return
    msg = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(msg)
    await db.commit()


async def get_chat_history(
    db: AsyncSession | None,
    session_id: str,
    limit: int = 10,
) -> list[dict]:
    """Retrieve recent chat history for a session."""
    if db is None:
        return []

    from sqlalchemy import select

    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    return [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(messages)
    ]
