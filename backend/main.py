import os
import re
from typing import List, Optional
from datetime import date
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.cloud import bigquery
from google.oauth2 import service_account
from dotenv import load_dotenv
import pandas as pd
import tomli

# Load environment variables
load_dotenv()

app = FastAPI(title="Email Search API")

# CORS configuration
# Get allowed origins from environment variable, default to wildcard for development
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
allowed_origins = [FRONTEND_URL] if FRONTEND_URL != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load secrets from config/secrets.toml if available
secrets = {}
try:
    secrets_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "secrets.toml")
    if os.path.exists(secrets_path):
        with open(secrets_path, "rb") as f:
            secrets = tomli.load(f)
except Exception as e:
    print(f"Warning: Could not load secrets.toml: {e}")

# Configuration - Priority: Env Vars > Secrets > Defaults
PROJECT_ID = os.getenv("PROJECT_ID") or secrets.get("PROJECT_ID")
DATASET = os.getenv("DATASET") or secrets.get("DATASET")
APP_PASSWORD = os.getenv("APP_PASSWORD") or secrets.get("APP_PASSWORD", "password123")

# Load dataset tables configuration
# Format: JSON array of {"id": "...", "label": "...", "table": "...", "summary": "..."}
import json

def load_dataset_tables():
    """Load dataset tables from env var or secrets, with fallback to legacy single table config."""
    tables_json = os.getenv("DATASET_TABLES") or secrets.get("DATASET_TABLES")
    
    if tables_json:
        try:
            return json.loads(tables_json)
        except json.JSONDecodeError as e:
            print(f"Warning: Failed to parse DATASET_TABLES: {e}")
    
    # Fallback to legacy single table configuration
    legacy_table = os.getenv("TABLE") or secrets.get("TABLE")
    legacy_summary = os.getenv("SUMMARY") or secrets.get("SUMMARY")
    
    if legacy_table:
        return [{
            "id": "default",
            "label": legacy_table,
            "table": legacy_table,
            "summary": legacy_summary
        }]
    
    return []

DATASET_TABLES = load_dataset_tables()

def get_table_config(table_id: str = None):
    """Get table configuration by ID, or return the first table if no ID provided."""
    if not DATASET_TABLES:
        return None, None
    
    if table_id:
        for t in DATASET_TABLES:
            if t["id"] == table_id:
                return t["table"], t.get("summary")
    
    # Default to first table
    first = DATASET_TABLES[0]
    return first["table"], first.get("summary")


# Initialize BigQuery client
def get_bigquery_client():
    try:
        # Priority 1: Try to use service account from secrets.toml
        if "gcp_service_account" in secrets:
            credentials = service_account.Credentials.from_service_account_info(
                secrets["gcp_service_account"]
            )
            return bigquery.Client(credentials=credentials, project=PROJECT_ID)
        
        # Priority 2: Try to use JSON credentials from environment variable (Railway)
        gcp_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if gcp_json:
            import json
            credentials_dict = json.loads(gcp_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_dict
            )
            return bigquery.Client(credentials=credentials, project=PROJECT_ID)
        
        # Priority 3: Fallback to default credentials (env vars or gcloud auth)
        return bigquery.Client(project=PROJECT_ID)
    except Exception as e:
        print(f"Error initializing BigQuery client: {e}")
        return None

client = get_bigquery_client()

# Models
class SearchRequest(BaseModel):
    query: Optional[str] = None
    limit: int = 100
    search_type: str = "All fields"
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    show_summaries: bool = False
    category_filter: Optional[str] = None
    subcategory_filter: Optional[str] = None
    table_id: Optional[str] = None  # ID of the selected table pair

class AuthRequest(BaseModel):
    password: str

@app.post("/api/auth")
async def check_auth(request: AuthRequest):
    if request.password == APP_PASSWORD:
        return {"authenticated": True}
    raise HTTPException(status_code=401, detail="Incorrect password")

@app.get("/api/categories")
async def get_categories(table_id: Optional[str] = Query(None)):
    TABLE, SUMMARY_TABLE = get_table_config(table_id)
    
    if not TABLE or not client:
        return {"categories": [], "subcategories": []}
    
    try:
        # Get categories from main documents table
        cat_query = f"SELECT DISTINCT category FROM `{PROJECT_ID}.{DATASET}.{TABLE}` WHERE category IS NOT NULL ORDER BY category"
        cat_job = client.query(cat_query)
        categories = [row.category for row in cat_job]
        
        # Get subcategories from summary table if available
        subcategories = []
        if SUMMARY_TABLE:
            try:
                subcat_query = f"SELECT DISTINCT subcategory FROM `{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}` WHERE subcategory IS NOT NULL ORDER BY subcategory"
                subcat_job = client.query(subcat_query)
                subcategories = [row.subcategory for row in subcat_job]
            except:
                pass
        
        return {"categories": categories, "subcategories": subcategories}
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return {"categories": [], "subcategories": []}

@app.get("/api/config")
async def get_config():
    """Return dataset configuration for frontend display"""
    return {
        "dataset": DATASET,
        "tables": DATASET_TABLES
    }

@app.get("/api/documents")
async def list_documents(table_id: Optional[str] = Query(None), limit: int = Query(500)):
    """Return a list of all documents with filename, category, and summary"""
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    
    TABLE, SUMMARY_TABLE = get_table_config(table_id)
    
    if not TABLE:
        raise HTTPException(status_code=400, detail="No table configured")
    
    # Check summary table availability
    summary_table_available = False
    if SUMMARY_TABLE:
        try:
            client.get_table(f"{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}")
            summary_table_available = True
        except:
            pass
    
    if summary_table_available:
        sql_query = f"""
        SELECT 
            e.md5,
            e.text,
            e.snippet,
            e.filename,
            e.category,
            e.size_human,
            e.page_count,
            e.path,
            e.mtime as date,
            s.summary,
            s.subcategory
        FROM `{PROJECT_ID}.{DATASET}.{TABLE}` e
        LEFT JOIN `{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}` s
        ON e.md5 = s.md5
        ORDER BY e.filename ASC
        LIMIT @limit
        """
    else:
        sql_query = f"""
        SELECT 
            md5,
            text,
            snippet,
            filename,
            category,
            size_human,
            page_count,
            path,
            mtime as date
        FROM `{PROJECT_ID}.{DATASET}.{TABLE}`
        ORDER BY filename ASC
        LIMIT @limit
        """
    
    query_params = [bigquery.ScalarQueryParameter("limit", "INT64", limit)]
    job_config = bigquery.QueryJobConfig(query_parameters=query_params)
    
    try:
        query_job = client.query(sql_query, job_config=job_config)
        results = []
        for row in query_job:
            item = dict(row)
            if item.get('date'):
                item['date'] = item['date'].isoformat()
            results.append(item)
        return {"documents": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search_emails(request: SearchRequest):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    
    # Get table configuration for selected table
    TABLE, SUMMARY_TABLE = get_table_config(request.table_id)
    
    if not TABLE:
        raise HTTPException(status_code=400, detail="No table configured")

    # Build WHERE clause
    query_params = []
    where_conditions = []
    
    # Check summary table availability
    summary_table_available = False
    if SUMMARY_TABLE:
        try:
            client.get_table(f"{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}")
            summary_table_available = True
        except:
            pass

    # Always include summaries when the summary table is available so the UI can
    # instantly show/hide without refetching or requerying.
    needs_summary_join = summary_table_available
    table_prefix = "e." if needs_summary_join else ""

    # Keyword search
    if request.query:
        if request.search_type == "Filename":
            search_fields = [f"{table_prefix}filename"]
        elif request.search_type == "Text":
            search_fields = [f"{table_prefix}text"]
        else:
            search_fields = [f"{table_prefix}filename", f"{table_prefix}text"]
        
        keywords = request.query.split()
        keyword_conditions = []
        for i, keyword in enumerate(keywords):
            field_conditions = " OR ".join([
                f"LOWER({field}) LIKE LOWER(@keyword_{i})" for field in search_fields
            ])
            keyword_conditions.append(f"({field_conditions})")
            query_params.append(bigquery.ScalarQueryParameter(f"keyword_{i}", "STRING", f"%{keyword}%"))
        
        where_conditions.append(" AND ".join(keyword_conditions))

    # Filters
    if request.date_from:
        where_conditions.append(f"DATE({table_prefix}mtime) >= @date_from")
        query_params.append(bigquery.ScalarQueryParameter("date_from", "DATE", request.date_from))
    
    if request.date_to:
        where_conditions.append(f"DATE({table_prefix}mtime) <= @date_to")
        query_params.append(bigquery.ScalarQueryParameter("date_to", "DATE", request.date_to))

    if request.category_filter:
        where_conditions.append(f"{table_prefix}category = @category")
        query_params.append(bigquery.ScalarQueryParameter("category", "STRING", request.category_filter))
    
    if request.subcategory_filter and needs_summary_join:
        where_conditions.append("s.subcategory = @subcategory")
        query_params.append(bigquery.ScalarQueryParameter("subcategory", "STRING", request.subcategory_filter))

    where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

    # Build SQL
    if needs_summary_join:
        sql_query = f"""
        SELECT 
            e.md5,
            e.text,
            e.snippet,
            e.filename,
            e.category,
            e.size_human,
            e.page_count,
            e.path,
            e.mtime as date,
            s.summary,
            s.subcategory
        FROM `{PROJECT_ID}.{DATASET}.{TABLE}` e
        LEFT JOIN `{PROJECT_ID}.{DATASET}.{SUMMARY_TABLE}` s
        ON e.md5 = s.md5
        WHERE {where_clause}
        ORDER BY e.mtime DESC
        LIMIT @limit
        """
    else:
        sql_query = f"""
        SELECT 
            md5,
            text,
            snippet,
            filename,
            category,
            size_human,
            page_count,
            path,
            mtime as date
        FROM `{PROJECT_ID}.{DATASET}.{TABLE}`
        WHERE {where_clause}
        ORDER BY mtime DESC
        LIMIT @limit
        """
    
    query_params.append(bigquery.ScalarQueryParameter("limit", "INT64", request.limit))

    job_config = bigquery.QueryJobConfig(query_parameters=query_params)
    
    try:
        query_job = client.query(sql_query, job_config=job_config)
        results = []
        for row in query_job:
            # Convert row to dict and handle date serialization
            item = dict(row)
            if item.get('date'):
                item['date'] = item['date'].isoformat()
            results.append(item)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
