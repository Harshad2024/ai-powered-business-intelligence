"""Authentication routes — login & signup via Supabase."""

from fastapi import APIRouter, HTTPException, status
from app.models.schemas import LoginRequest, SignupRequest, AuthResponse
from app.utils.helpers import create_access_token

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate user and return JWT token."""
    try:
        from app.services.supabase_client import get_supabase
        sb = get_supabase()
        result = sb.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        user = result.user
        token = create_access_token({"sub": user.id, "email": user.email})
        return AuthResponse(
            access_token=token,
            user={"id": user.id, "email": user.email, "name": user.user_metadata.get("name", "")},
        )
    except RuntimeError as e:
        # Supabase not configured — use demo mode
        if "not configured" in str(e):
            token = create_access_token({"sub": "demo-user", "email": req.email})
            return AuthResponse(
                access_token=token,
                user={"id": "demo-user", "email": req.email, "name": "Demo User"},
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        error_msg = str(e)
        if "Email not confirmed" in error_msg:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email not confirmed. Please check your inbox or disable 'Confirm email' in Supabase.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error_msg)


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    """Register a new user."""
    try:
        from app.services.supabase_client import get_supabase
        sb = get_supabase()
        result = sb.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": {"data": {"name": req.name}},
        })
        user = result.user
        token = create_access_token({"sub": user.id, "email": user.email})
        return AuthResponse(
            access_token=token,
            user={"id": user.id, "email": user.email, "name": req.name},
        )
    except RuntimeError as e:
        if "not configured" in str(e):
            token = create_access_token({"sub": "demo-user", "email": req.email})
            return AuthResponse(
                access_token=token,
                user={"id": "demo-user", "email": req.email, "name": req.name},
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
