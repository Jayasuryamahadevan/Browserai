"""
Saturn Browser - Semantic Memory Engine
========================================
Elite-level semantic search over browsing memories using bge-base-en-v1.5.

This engine provides:
- Content extraction and cleaning
- Embedding generation with bge-base-en-v1.5
- FAISS vector storage and retrieval
- Semantic search API
"""

import os
import json
import uuid
import logging
import shutil
import pickle
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path

import numpy as np
try:
    import faiss
except ImportError:
    # Fallback for dev environments without faiss-cpu
    class MockFaiss:
        def IndexFlatL2(self, d): return self
        def add(self, x): pass
        def search(self, q, k): return np.array([[0.0]*k]), np.array([[-1]*k])
        def ntotal(self): return 0
        def write_index(self, idx, path): pass
        def read_index(self, path): return self
    faiss = MockFaiss()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [Memory] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

MODEL_NAME = "BAAI/bge-base-en-v1.5"
EMBEDDING_DIM = 768
# Store data locally in the project folder
SCRIPT_DIR = Path(__file__).parent.resolve()
DATA_DIR = Path(os.environ.get("MEMORY_DATA_DIR", str(SCRIPT_DIR / "data")))
INDEX_PATH = DATA_DIR / "faiss.index"
METADATA_PATH = DATA_DIR / "metadata.json"

# ============================================================================
# App Implementation
# ============================================================================

app = FastAPI(title="Saturn Memory Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Data Models
# ============================================================================

class PageContent(BaseModel):
    """Content from a web page to be memorized."""
    url: str
    title: str
    content: str  # Raw HTML or extracted text
    is_html: bool = True  # If True, content will be processed
    engagement_score: float = 1.0  # Time spent + scroll depth metric
    timestamp: Optional[int] = None

class SearchQuery(BaseModel):
    """Semantic search query."""
    query: str
    top_k: int = 10
    min_score: float = 0.0

class Memory(BaseModel):
    """A stored memory with metadata."""
    id: str
    url: str
    title: str
    summary: str
    content: str
    engagement_score: float
    timestamp: int
    similarity: Optional[float] = None
    chunk_index: int = 0
    total_chunks: int = 1

class MemoryStats(BaseModel):
    total_memories: int
    total_chunks: int
    last_update: Optional[int]

# ============================================================================
# Core Components
# ============================================================================

class ContentExtractor:
    """Extracts clean text from HTML."""
    def extract(self, html: str) -> str:
        if not html: return ""
        soup = BeautifulSoup(html, "html.parser")
        
        # Remove junk
        for tag in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
            tag.decompose()
            
        text = soup.get_text(separator=" ", strip=True)
        return text

class SemanticChunker:
    """Splits text into chunks using tokenizer."""
    def __init__(self, tokenizer, chunk_size=400, chunk_overlap=80):
        self.tokenizer = tokenizer
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
    def chunk(self, text: str) -> List[str]:
        if not text: return []
        tokens = self.tokenizer.encode(text, add_special_tokens=False)
        if len(tokens) <= self.chunk_size:
            return [text]
            
        chunks = []
        stride = self.chunk_size - self.chunk_overlap
        for i in range(0, len(tokens), stride):
            chunk_tokens = tokens[i : i + self.chunk_size]
            chunk_text = self.tokenizer.decode(chunk_tokens, skip_special_tokens=True)
            chunks.append(chunk_text)
            if i + self.chunk_size >= len(tokens): break
        return chunks

class EmbeddingEngine:
    """Handles model loading and embedding."""
    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self._is_loading = False

    def load(self):
        if self.model is not None or self._is_loading: return
        self._is_loading = True
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            self.tokenizer = self.model.tokenizer
            logger.info(f"Model loaded. Dim: {EMBEDDING_DIM}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None
        finally:
            self._is_loading = False

    def is_ready(self) -> bool:
        return self.model is not None

    def embed_passage(self, text: str) -> np.ndarray:
        if not self.model: self.load()
        return self.model.encode(text, normalize_embeddings=True)

    def embed_query(self, text: str) -> np.ndarray:
        if not self.model: self.load()
        instruction = "Represent this sentence for searching relevant passages: "
        return self.model.encode(instruction + text, normalize_embeddings=True)

class MemoryStore:
    """FAISS-based Vector Store."""
    def __init__(self):
        self.index = None
        self.metadata = {}
        self.load()

    def load(self):
        if INDEX_PATH.exists() and METADATA_PATH.exists():
            try:
                self.index = faiss.read_index(str(INDEX_PATH))
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded index with {self.index.ntotal} vectors")
            except Exception as e:
                logger.error(f"Failed to load index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()

    def _create_new_index(self):
        self.index = faiss.IndexFlatL2(EMBEDDING_DIM)
        self.metadata = {}
        logger.info("Created new index")

    def add(self, vector: np.ndarray, meta: Dict[str, Any]):
        if self.index is None: self._create_new_index()
        
        # FAISS expects float32
        v = np.array([vector]).astype('float32')
        self.index.add(v)
        
        # ID strategy: We use metadata keys as IDs
        # FAISS uses sequential integer IDs (0, 1, 2...)
        # We need to map FAISS ID back to our UUID
        # But wait, IndexFlatL2 doesn't support custom IDs easily without IndexIDMap.
        # For simplicity, we'll assume sequential addition and keep a list?
        # A Better approach for simple usage: Rebuild index on save or just use Python list for metadata mapping?
        # Let's use IndexIDMap if possible, OR just store an "index_to_id" map.
        
        # Current naive impl: metadata is dict by ID. 
        # But we need to map retrieval result (int index) to ID.
        # Let's add a field 'faiss_id' to metadata? 
        # Actually, let's just keep a list of IDs corresponding to faiss indices.
        # This implementation requires 'index_to_id.json' or ensuring metadata is sorted/list.
        
        # FIX: Let's use IndexIDMap so we can add with IDs.
        # However, simple IndexFlatL2 expects sequential.
        # We will assume metadata keys are UUIDs. 
        # We need a parallel list to map faiss_idx -> uuid.
        
        # Re-loading implementation:
        # We'll keep 'id_map' in metadata?
        pass

    def _save(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(INDEX_PATH))
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f)

    # ... Actually implementing a robust store in one file is tricky without IDMap.
    # Let's switch to a simple in-memory approach that saves periodically for this MVP.
    # We will use a wrapper that keeps vectors in memory and rebuilds FAISS on logic if needed,
    # OR use IndexIDMap.
    
    # REVISED STORE FOR SIMPLICITY ANDROBUSTNESS
    pass

# COMPLETE STORE IMPLEMENTATION
class SimpleMemoryStore:
    def __init__(self):
        self.ids = [] # List of IDs matching index order
        self.metadata = {} # ID -> Dict
        self.vectors = [] # List of numpy arrays
        self.index = faiss.IndexFlatL2(EMBEDDING_DIM)
        self.load()

    def load(self):
        if DATA_DIR.exists():
            try:
                if (DATA_DIR / "ids.json").exists():
                    with open(DATA_DIR / "ids.json", "r") as f: self.ids = json.load(f)
                if (DATA_DIR / "metadata.json").exists():
                    with open(DATA_DIR / "metadata.json", "r") as f: self.metadata = json.load(f)
                if (DATA_DIR / "vectors.npy").exists():
                    self.vectors = list(np.load(DATA_DIR / "vectors.npy"))
                    # Rebuild index
                    self.index = faiss.IndexFlatL2(EMBEDDING_DIM)
                    if self.vectors:
                        matrix = np.array(self.vectors).astype('float32')
                        self.index.add(matrix)
                logger.info(f"Loaded store with {len(self.ids)} items")
            except Exception as e:
                logger.error(f"Load failed: {e}")

    def save(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(DATA_DIR / "ids.json", "w") as f: json.dump(self.ids, f)
        with open(DATA_DIR / "metadata.json", "w") as f: json.dump(self.metadata, f)
        np.save(DATA_DIR / "vectors.npy", np.array(self.vectors).astype('float32'))

    def add(self, vector: np.ndarray, meta: Dict[str, Any]):
        self.vectors.append(vector)
        self.ids.append(meta['id'])
        self.metadata[meta['id']] = meta
        
        v = np.array([vector]).astype('float32')
        self.index.add(v)
        self.save()

    def search(self, query_vec: np.ndarray, k: int) -> List[Dict[str, Any]]:
        if self.index.ntotal == 0: return []
        
        q = np.array([query_vec]).astype('float32')
        D, I = self.index.search(q, k)
        
        results = []
        for i, idx in enumerate(I[0]):
            if idx != -1 and idx < len(self.ids):
                mem_id = self.ids[idx]
                if mem_id in self.metadata:
                    item = self.metadata[mem_id].copy()
                    item['similarity'] = float(1.0 - D[0][i]) # Approx
                    results.append(item)
        return results
        
    def get_stats(self) -> MemoryStats:
        return MemoryStats(
            total_memories=len(set(m['url'] for m in self.metadata.values())),
            total_chunks=len(self.metadata),
            last_update=int(datetime.now().timestamp()*1000)
        )

# ============================================================================
# Globals
# ============================================================================
embedding_engine = None
memory_store = None
content_extractor = ContentExtractor()

def get_embedding_engine():
    global embedding_engine
    if embedding_engine is None:
        embedding_engine = EmbeddingEngine()
    return embedding_engine

def get_memory_store():
    global memory_store
    if memory_store is None:
        memory_store = SimpleMemoryStore()
    return memory_store

def get_chunker():
    engine = get_embedding_engine()
    return SemanticChunker(engine.tokenizer)

# ============================================================================
# Routes
# ============================================================================

@app.get("/health")
def health_check():
    engine = get_embedding_engine()
    return {
        "status": "online", 
        "model": MODEL_NAME,
        "ai_ready": engine.is_ready()
    }

@app.post("/init")
async def init_engine():
    """Trigger model loading in background."""
    engine = get_embedding_engine()
    if not engine.is_ready():
        engine.load()
    return {"status": "ready"}

@app.get("/stats", response_model=MemoryStats)
async def get_stats():
    return get_memory_store().get_stats()

@app.post("/store", response_model=Memory)
async def store_memory(page: PageContent):
    store = get_memory_store()
    engine = get_embedding_engine()
    chunker = get_chunker()
    # For simplified store, deletion is hard without rebuild. 
    # For MVP, we ignore deletion or implement soft delete.
    # Let's just append new ones for now to avoid complexity in this file drop.
    
    content = page.content
    if page.is_html:
        content = content_extractor.extract(content)
        
    if len(content) < 50:
        raise HTTPException(status_code=400, detail="Content too short")
        
    chunks = chunker.chunk(content)
    base_id = str(uuid.uuid4())
    timestamp = page.timestamp or int(datetime.now().timestamp() * 1000)
    
    first_meta = None
    
    for i, chunk_text in enumerate(chunks):
        embedding = engine.embed_passage(chunk_text)
        chunk_id = f"{base_id}_{i}"
        
        meta = {
            "id": chunk_id,
            "parent_id": base_id,
            "url": page.url,
            "title": page.title,
            "summary": chunk_text[:200] + "...",
            "content": chunk_text,
            "engagement_score": page.engagement_score,
            "timestamp": timestamp,
            "chunk_index": i,
            "total_chunks": len(chunks)
        }
        
        store.add(embedding, meta)
        if i == 0: first_meta = meta
        
    return Memory(**first_meta)

@app.post("/search", response_model=List[Memory])
async def search_memories(query: SearchQuery):
    store = get_memory_store()
    engine = get_embedding_engine()
    
    q_vec = engine.embed_query(query.query)
    # Get more to diversify
    results = store.search(q_vec, query.top_k * 3)
    
    # Diversity filter
    seen_urls = set()
    diverse = []
    for r in results:
        if r['url'] in seen_urls: continue
        seen_urls.add(r['url'])
        diverse.append(r)
        if len(diverse) >= query.top_k: break
        
    return [Memory(**r) for r in diverse]

@app.get("/memories", response_model=List[Memory])
async def list_memories(limit: int = 50, offset: int = 0):
    store = get_memory_store()
    all_mems = list(store.metadata.values())
    all_mems.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
    return [Memory(**m) for m in all_mems[offset : offset + limit]]

@app.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str):
    # Not implemented fully in SimpleStore for MVP
    return {"status": "not_implemented_yet"}

if __name__ == "__main__":
    import uvicorn
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    uvicorn.run(app, host="127.0.0.1", port=7420)
