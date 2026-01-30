"""
Saturn Memory Engine - Launcher
================================
Starts the memory engine with proper initialization.
"""

import subprocess
import sys
import os
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed."""
    required = ['fastapi', 'uvicorn', 'sentence_transformers', 'faiss', 'bs4']
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"[Memory] Installing missing packages: {missing}")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r',
            str(Path(__file__).parent / 'requirements.txt')
        ])

def main():
    """Start the memory engine."""
    # Check and install dependencies
    check_dependencies()
    
    # Set environment variables
    os.environ.setdefault('MEMORY_DATA_DIR', 'D:/SaturnMemory')
    
    # Import and run
    from memory_engine import app
    import uvicorn
    
    print("=" * 60)
    print("Saturn Memory Engine - Starting...")
    print("=" * 60)
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=7420,
        log_level="info"
    )

if __name__ == "__main__":
    main()
