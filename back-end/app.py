"""
FastAPI backend for Dial-In Application - Main application file
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from contextlib import asynccontextmanager
from database import Base, engine
from routes import auth, categories, tasks, events, rules, user, user_data
from rule_engine import RuleScheduler

# Create the database tables
Base.metadata.create_all(bind=engine)

rule_scheduler = RuleScheduler(interval_seconds=60, horizon_days=30)


@asynccontextmanager
async def lifespan(_: FastAPI):
    rule_scheduler.start()
    try:
        yield
    finally:
        rule_scheduler.stop()


# Initialize FastAPI app
app = FastAPI(
    title="Dial-In API",
    description="Backend API for the Dial-In task and event management application",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(rules.router, prefix="/rules", tags=["Rules"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(user_data.router, prefix="/user_data", tags=["User Data"])

@app.get("/")
async def root():
    return {"message": "Dial-In API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
