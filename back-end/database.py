"""Database configuration and session management."""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./instance/data.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema_updates():
    """Apply lightweight schema updates for existing SQLite databases."""
    with engine.connect() as connection:
        table_info = connection.execute(text("PRAGMA table_info(users)")).fetchall()
        user_columns = {row[1] for row in table_info}

        if "avatar" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN avatar VARCHAR(10)"))
            connection.commit()
