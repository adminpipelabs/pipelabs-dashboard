from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

router = APIRouter()

class AdminOverview(BaseModel):
              active_clients: int = 0
              total_bots: int = 0
              volume_24h: float = 0.0
              revenue_estimate: float = 0.0

clients_db: List[Dict[str, Any]] = []
api_keys_db: List[Dict[str, Any]] = []
next_client_id = 1
next_key_id = 1

@router.get("/admin/overview")
async def get_admin_overview():
              return {"active_clients": len(clients_db), "total_bots": 0, "volume_24h": 0.0, "revenue_estimate": 0.0}

@router.get("/admin/dashboard")
async def get_dashboard():
              return {"active_clients": len(clients_db), "total_bots": 0, "volume_24h": 0.0, "revenue_estimate": 0.0}

@router.get("/admin/tokens")
async def get_tokens():
              return []

@router.get("/admin/clients")
async def list_clients():
              return clients_db

@router.post("/admin/clients")
async def create_client(data: dict):
              global next_client_id
              client = dict(data)
              client["id"] = next_client_id
              next_client_id += 1
              clients_db.append(client)
              return client

@router.get("/admin/api-keys")
async def list_api_keys():
              return api_keys_db

@router.post("/admin/api-keys")
async def create_api_key(data: dict):
              global next_key_id
              api_key = dict(data)
              api_key["id"] = next_key_id
              next_key_id += 1
              api_keys_db.append(api_key)
              return api_key

@router.get("/admin/api-keys/{key_id}")
async def get_api_key(key_id: int):
              for key in api_keys_db:
                                if key["id"] == key_id:
                                                      return key
                                              return {"error": "API key not found"}

          @router.delete("/admin/api-keys/{key_id}")
async def delete_api_key(key_id: int):
              global api_keys_db
              api_keys_db = [key for key in api_keys_db if key["id"] != key_id]
              return {"success": True}
