"""Upload routes — CSV file upload with auto-detection of columns."""

import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from app.models.schemas import UploadStatusResponse
from app.utils.helpers import verify_token
from app.services.file_manager import save_file, save_column_map, get_user_file_info
from app.utils.column_validator import auto_detect_columns

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("")
async def upload_csv(file: UploadFile = File(...), user: dict = Depends(verify_token)):
    """
    Upload a CSV file for analysis.

    - Validates file type (.csv) and size (< 10MB)
    - Reads with Pandas to detect column names
    - AUTO-DETECTS column mapping (no manual step needed)
    - Saves file + mapping to local storage
    - Returns file_key, detected columns, and auto-detected mapping
    """
    user_id = user.get("sub", "demo-user")

    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted. Please upload a .csv file.",
        )

    # Read file content
    content = await file.read()

    # Validate size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.",
        )

    # Validate it's a valid CSV by trying to read it
    try:
        df = pd.read_csv(io.BytesIO(content))
        if len(df) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty. Please upload a file with data.",
            )
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty or has no valid data.",
        )
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse CSV file: {str(e)}",
        )

    # Auto-detect column mapping
    try:
        col_map = auto_detect_columns(df)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Save to storage
    metadata = save_file(user_id, content, file.filename)

    # Auto-save detected column mapping (no manual step needed!)
    save_column_map(user_id, metadata["file_key"], col_map)

    return {
        "file_key": metadata["file_key"],
        "original_name": metadata["original_name"],
        "row_count": metadata["row_count"],
        "columns": metadata["columns"],
        "col_map": col_map,
        "mapping_done": True,
    }


@router.get("/status", response_model=UploadStatusResponse)
async def upload_status(user: dict = Depends(verify_token)):
    """Check if the user has uploaded a file and mapped columns."""
    user_id = user.get("sub", "demo-user")
    info = get_user_file_info(user_id)

    if info is None:
        return UploadStatusResponse(has_file=False, mapping_done=False)

    return UploadStatusResponse(
        has_file=True,
        file_key=info.get("file_key"),
        original_name=info.get("original_name"),
        row_count=info.get("row_count"),
        columns=info.get("columns"),
        mapping_done=info.get("mapping_done", False),
        col_map=info.get("col_map"),
    )
