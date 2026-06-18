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

        # Add end_date column to tasks if missing
        task_info = connection.execute(text("PRAGMA table_info(tasks)")).fetchall()
        task_columns = {row[1] for row in task_info}

        if "end_date" not in task_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN end_date DATETIME"))
            connection.commit()

        if "due_time" not in task_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN due_time VARCHAR(5)"))
            connection.execute(
                text(
                    "UPDATE tasks SET due_time = CASE "
                    "WHEN due_date IS NOT NULL AND substr(due_date, 12, 5) != '00:00' "
                    "THEN substr(due_date, 12, 5) ELSE NULL END"
                )
            )
            connection.execute(text("UPDATE tasks SET due_date = substr(due_date, 1, 10) WHERE due_date IS NOT NULL"))
            connection.commit()

        if "end_time" not in task_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN end_time VARCHAR(5)"))
            connection.execute(
                text(
                    "UPDATE tasks SET end_time = CASE "
                    "WHEN end_date IS NOT NULL AND substr(end_date, 12, 5) != '00:00' "
                    "THEN substr(end_date, 12, 5) ELSE NULL END"
                )
            )
            connection.execute(text("UPDATE tasks SET end_date = substr(end_date, 1, 10) WHERE end_date IS NOT NULL"))
            connection.commit()

        if "icon" not in task_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN icon VARCHAR(10)"))
            connection.commit()

        if "color" not in task_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN color VARCHAR(7)"))
            connection.commit()

        category_info = connection.execute(text("PRAGMA table_info(categories)")).fetchall()
        category_columns = {row[1] for row in category_info}

        if "color" not in category_columns:
            connection.execute(text("ALTER TABLE categories ADD COLUMN color VARCHAR(7)"))
            connection.commit()

        rule_info = connection.execute(text("PRAGMA table_info(rules)")).fetchall()
        rule_columns = {row[1] for row in rule_info}

        if "icon" not in rule_columns:
            connection.execute(text("ALTER TABLE rules ADD COLUMN icon VARCHAR(10)"))
            connection.commit()

        if "color" not in rule_columns:
            connection.execute(text("ALTER TABLE rules ADD COLUMN color VARCHAR(7)"))
            connection.commit()

        user_data_info = connection.execute(text("PRAGMA table_info(user_data)")).fetchall()
        user_data_columns = {row[1] for row in user_data_info}

        if "calendar_view" not in user_data_columns:
            connection.execute(text("ALTER TABLE user_data ADD COLUMN calendar_view VARCHAR(20) DEFAULT 'month'"))
            connection.commit()

        users_with_uncategorized_rules = connection.execute(
            text("SELECT DISTINCT user_id FROM rules WHERE category_id IS NULL")
        ).fetchall()

        for row in users_with_uncategorized_rules:
            user_id = row[0]
            if user_id is None:
                continue

            existing_category = connection.execute(
                text("SELECT id FROM categories WHERE user_id = :user_id AND name = 'General' LIMIT 1"),
                {"user_id": user_id},
            ).fetchone()

            if existing_category:
                general_category_id = existing_category[0]
            else:
                connection.execute(
                    text(
                        "INSERT INTO categories (name, icon, user_id, created_at) "
                        "VALUES (:name, :icon, :user_id, CURRENT_TIMESTAMP)"
                    ),
                    {
                        "name": "General",
                        "icon": "📁",
                        "user_id": user_id,
                    },
                )

                general_category_id = connection.execute(
                    text("SELECT id FROM categories WHERE user_id = :user_id AND name = 'General' ORDER BY id DESC LIMIT 1"),
                    {"user_id": user_id},
                ).scalar()

            if general_category_id is not None:
                connection.execute(
                    text(
                        "UPDATE rules SET category_id = :category_id "
                        "WHERE user_id = :user_id AND category_id IS NULL"
                    ),
                    {
                        "category_id": general_category_id,
                        "user_id": user_id,
                    },
                )

        connection.commit()
