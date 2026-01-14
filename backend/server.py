from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import httpx
from urllib.parse import urlencode

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    user_info: Optional[Dict[str, Any]] = None
    server_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class Category(BaseModel):
    category_id: str
    category_name: str
    parent_id: Optional[int] = 0

class LiveStream(BaseModel):
    stream_id: int
    num: int
    name: str
    stream_type: str
    stream_icon: Optional[str] = None
    epg_channel_id: Optional[str] = None
    added: Optional[str] = None
    is_adult: Optional[str] = "0"
    category_id: Optional[str] = None
    custom_sid: Optional[str] = None
    tv_archive: Optional[int] = 0
    direct_source: Optional[str] = None
    tv_archive_duration: Optional[int] = 0

class StreamUrlRequest(BaseModel):
    username: str
    password: str
    stream_id: int
    extension: str = "m3u8"

# ==================== XTREAM CODES API HELPER ====================

class XtreamCodesAPI:
    def __init__(self, base_url: str = "https://s.luxuztv.com:443"):
        self.base_url = base_url.rstrip('/')
    
    async def authenticate(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user and get account info"""
        try:
            params = {
                'username': username,
                'password': password
            }
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                if data.get('user_info', {}).get('auth') == 1 or data.get('user_info', {}).get('status') == 'Active':
                    return {
                        'success': True,
                        'user_info': data.get('user_info', {}),
                        'server_info': data.get('server_info', {})
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Invalid credentials'
                    }
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_live_categories(self, username: str, password: str) -> List[Dict[str, Any]]:
        """Get all live TV categories"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_live_categories'
            }
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get categories error: {str(e)}")
            return []
    
    async def get_live_streams(self, username: str, password: str, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get live streams, optionally filtered by category"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_live_streams'
            }
            if category_id:
                params['category_id'] = category_id
            
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get live streams error: {str(e)}")
            return []
    
    def get_stream_url(self, username: str, password: str, stream_id: int, extension: str = "m3u8") -> str:
        """Generate stream URL for playback"""
        return f"{self.base_url}/live/{username}/{password}/{stream_id}.{extension}"
    
    async def get_epg(self, username: str, password: str, stream_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get EPG data for a specific stream"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_short_epg',
                'stream_id': stream_id,
                'limit': limit
            }
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return data.get('epg_listings', [])
        except Exception as e:
            logger.error(f"Get EPG error: {str(e)}")
            return []
    
    async def get_vod_categories(self, username: str, password: str) -> List[Dict[str, Any]]:
        """Get all VOD categories"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_vod_categories'
            }
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get VOD categories error: {str(e)}")
            return []
    
    async def get_vod_streams(self, username: str, password: str, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get VOD streams, optionally filtered by category"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_vod_streams'
            }
            if category_id:
                params['category_id'] = category_id
            
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get VOD streams error: {str(e)}")
            return []
    
    async def get_series_categories(self, username: str, password: str) -> List[Dict[str, Any]]:
        """Get all series categories"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_series_categories'
            }
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get series categories error: {str(e)}")
            return []
    
    async def get_series(self, username: str, password: str, category_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get series, optionally filtered by category"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_series'
            }
            if category_id:
                params['category_id'] = category_id
            
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get series error: {str(e)}")
            return []
    
    async def get_series_info(self, username: str, password: str, series_id: int) -> Dict[str, Any]:
        """Get series info with seasons and episodes"""
        try:
            params = {
                'username': username,
                'password': password,
                'action': 'get_series_info',
                'series_id': series_id
            }
            url = f"{self.base_url}/player_api.php?{urlencode(params)}"
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Get series info error: {str(e)}")
            return {}
    
    def get_vod_url(self, username: str, password: str, vod_id: int, extension: str = "mp4") -> str:
        """Generate VOD URL for playback"""
        return f"{self.base_url}/movie/{username}/{password}/{vod_id}.{extension}"
    
    def get_series_url(self, username: str, password: str, episode_id: int, extension: str = "mp4") -> str:
        """Generate series episode URL for playback"""
        return f"{self.base_url}/series/{username}/{password}/{episode_id}.{extension}"

# Initialize API client
xtream_api = XtreamCodesAPI()

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Luxuz TV API v1.0", "status": "running"}

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user with Xtream Codes API"""
    try:
        result = await xtream_api.authenticate(request.username, request.password)
        
        if result['success']:
            # Store session in database
            session_data = {
                'username': request.username,
                'password': request.password,
                'user_info': result['user_info'],
                'server_info': result['server_info'],
                'created_at': datetime.utcnow(),
                'last_activity': datetime.utcnow()
            }
            await db.sessions.update_one(
                {'username': request.username},
                {'$set': session_data},
                upsert=True
            )
            
            return LoginResponse(
                success=True,
                user_info=result['user_info'],
                server_info=result['server_info']
            )
        else:
            return LoginResponse(
                success=False,
                error=result.get('error', 'Authentication failed')
            )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live/categories")
async def get_live_categories(username: str, password: str):
    """Get all live TV categories"""
    try:
        # Check cache first
        cache_key = f"categories_{username}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 3600:
            return cached['data']
        
        # Fetch from API
        categories = await xtream_api.get_live_categories(username, password)
        
        # Cache the result
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': categories, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return categories
    except Exception as e:
        logger.error(f"Get categories error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live/streams")
async def get_live_streams(username: str, password: str, category_id: Optional[str] = None):
    """Get live streams, optionally filtered by category"""
    try:
        # Check cache first
        cache_key = f"streams_{username}_{category_id or 'all'}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 1800:
            return cached['data']
        
        # Fetch from API
        streams = await xtream_api.get_live_streams(username, password, category_id)
        
        # Cache the result
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': streams, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return streams
    except Exception as e:
        logger.error(f"Get streams error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/live/stream-url")
async def get_stream_url(request: StreamUrlRequest):
    """Generate stream URL for playback"""
    try:
        stream_url = xtream_api.get_stream_url(
            request.username,
            request.password,
            request.stream_id,
            request.extension
        )
        return {"stream_url": stream_url}
    except Exception as e:
        logger.error(f"Get stream URL error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/live/epg/{stream_id}")
async def get_epg(stream_id: int, username: str, password: str, limit: int = 10):
    """Get EPG data for a specific stream"""
    try:
        epg_data = await xtream_api.get_epg(username, password, stream_id, limit)
        return epg_data
    except Exception as e:
        logger.error(f"Get EPG error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== VOD ROUTES ====================

@api_router.get("/vod/categories")
async def get_vod_categories(username: str, password: str):
    """Get all VOD categories"""
    try:
        cache_key = f"vod_categories_{username}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 3600:
            return cached['data']
        
        categories = await xtream_api.get_vod_categories(username, password)
        
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': categories, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return categories
    except Exception as e:
        logger.error(f"Get VOD categories error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vod/streams")
async def get_vod_streams(username: str, password: str, category_id: Optional[str] = None):
    """Get VOD streams, optionally filtered by category"""
    try:
        cache_key = f"vod_streams_{username}_{category_id or 'all'}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 1800:
            return cached['data']
        
        streams = await xtream_api.get_vod_streams(username, password, category_id)
        
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': streams, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return streams
    except Exception as e:
        logger.error(f"Get VOD streams error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/vod/stream-url")
async def get_vod_url(request: StreamUrlRequest):
    """Generate VOD URL for playback"""
    try:
        vod_url = xtream_api.get_vod_url(
            request.username,
            request.password,
            request.stream_id,
            request.extension if request.extension != "m3u8" else "mp4"
        )
        return {"stream_url": vod_url}
    except Exception as e:
        logger.error(f"Get VOD URL error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SERIES ROUTES ====================

@api_router.get("/series/categories")
async def get_series_categories(username: str, password: str):
    """Get all series categories"""
    try:
        cache_key = f"series_categories_{username}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 3600:
            return cached['data']
        
        categories = await xtream_api.get_series_categories(username, password)
        
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': categories, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return categories
    except Exception as e:
        logger.error(f"Get series categories error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/series/list")
async def get_series_list(username: str, password: str, category_id: Optional[str] = None):
    """Get series list, optionally filtered by category"""
    try:
        cache_key = f"series_list_{username}_{category_id or 'all'}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 1800:
            return cached['data']
        
        series = await xtream_api.get_series(username, password, category_id)
        
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': series, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return series
    except Exception as e:
        logger.error(f"Get series error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/series/info/{series_id}")
async def get_series_info_endpoint(series_id: int, username: str, password: str):
    """Get series info with seasons and episodes"""
    try:
        cache_key = f"series_info_{username}_{series_id}"
        cached = await db.cache.find_one({'key': cache_key})
        
        if cached and (datetime.utcnow() - cached['timestamp']).seconds < 3600:
            return cached['data']
        
        series_info = await xtream_api.get_series_info(username, password, series_id)
        
        await db.cache.update_one(
            {'key': cache_key},
            {'$set': {'key': cache_key, 'data': series_info, 'timestamp': datetime.utcnow()}},
            upsert=True
        )
        
        return series_info
    except Exception as e:
        logger.error(f"Get series info error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/series/episode-url")
async def get_series_episode_url(request: StreamUrlRequest):
    """Generate series episode URL for playback"""
    try:
        episode_url = xtream_api.get_series_url(
            request.username,
            request.password,
            request.stream_id,  # episode_id
            request.extension if request.extension != "m3u8" else "mp4"
        )
        return {"stream_url": episode_url}
    except Exception as e:
        logger.error(f"Get episode URL error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()