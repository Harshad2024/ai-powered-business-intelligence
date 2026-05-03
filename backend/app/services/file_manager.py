"""
File manager — handles per-user CSV storage and retrieval.

Uses LOCAL filesystem to store user uploaded CSVs temporarily.
"""

import os
import json
import uuid
from typing import Optional
import pandas as pd
from app.config import BASE_DIR

UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def _user_dir(user_id: str) -> str:
    """Get the upload directory for a specific user."""
    path = os.path.join(UPLOADS_DIR, user_id)
    os.makedirs(path, exist_ok=True)
    return path


def save_file(user_id: str, file_bytes: bytes, original_name: str) -> dict:
    """
    Save uploaded CSV file to local storage.

    Returns:
        { file_key, original_name, row_count, columns }
    """
    file_key = f"{uuid.uuid4().hex}.csv"
    user_path = _user_dir(user_id)
    file_path = os.path.join(user_path, file_key)

    # Write file
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Read to get metadata
    df = pd.read_csv(file_path)
    columns = list(df.columns)
    row_count = len(df)

    # Save metadata
    metadata = {
        "file_key": file_key,
        "original_name": original_name,
        "row_count": row_count,
        "columns": columns,
    }
    meta_path = os.path.join(user_path, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata


def save_column_map(user_id: str, file_key: str, col_map: dict) -> None:
    """Save the user's column mapping to local storage."""
    user_path = _user_dir(user_id)
    map_data = {"file_key": file_key, "col_map": col_map}
    map_path = os.path.join(user_path, "column_map.json")
    with open(map_path, "w") as f:
        json.dump(map_data, f, indent=2)


def get_user_file_info(user_id: str) -> Optional[dict]:
    """
    Get the user's current file metadata and column map.

    Returns:
        { file_key, original_name, row_count, columns, col_map, mapping_done }
        or None if no file uploaded yet.
    """
    user_path = os.path.join(UPLOADS_DIR, user_id)
    meta_path = os.path.join(user_path, "metadata.json")
    map_path = os.path.join(user_path, "column_map.json")

    if not os.path.exists(meta_path):
        return None

    with open(meta_path, "r") as f:
        metadata = json.load(f)

    # Add column map if available
    if os.path.exists(map_path):
        with open(map_path, "r") as f:
            map_data = json.load(f)
        metadata["col_map"] = map_data.get("col_map")
        metadata["mapping_done"] = True
    else:
        metadata["col_map"] = None
        metadata["mapping_done"] = False

    return metadata


def load_user_dataframe(user_id: str) -> tuple[pd.DataFrame, dict]:
    """
    Load the user's uploaded CSV as a DataFrame along with their column mapping.

    Returns:
        (df, col_map) tuple

    Raises:
        FileNotFoundError if no file uploaded
        ValueError if column mapping not done
    """
    info = get_user_file_info(user_id)

    if info is None:
        raise FileNotFoundError("No file uploaded yet. Please upload a CSV file first.")

    if not info.get("mapping_done") or info.get("col_map") is None:
        raise ValueError("Column mapping not completed. Please map your CSV columns first.")

    file_path = os.path.join(UPLOADS_DIR, user_id, info["file_key"])

    if not os.path.exists(file_path):
        raise FileNotFoundError("Uploaded file not found. Please re-upload your CSV file.")

    df = pd.read_csv(file_path)
    col_map = info["col_map"]

    return df, col_map
