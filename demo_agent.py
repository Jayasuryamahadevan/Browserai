import requests
import json
import threading
import time
import sys

# Configuration
MCP_SERVER_URL = "http://localhost:3005/sse"
POST_URL = "http://localhost:3005/messages"

def listen_for_events():
    print("[Agent] Connecting to SSE stream...")
    
    with requests.get(MCP_SERVER_URL, stream=True) as response:
        if response.status_code != 200:
            print(f"[Agent] Failed to connect: {response.status_code}")
            return

        print("[Agent] Connected! Listening for events...")
        
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                
                # Check for "event: endpoint" which carries the session ID path
                # Standard SSE format: 
                # event: endpoint
                # data: /messages?sessionId=...
                
                # Note: iter_lines yields lines. We need to track state.
                # But for this simple demo, we can just look for the data line containing sessionId
                
                if decoded_line.startswith("data: /messages?sessionId="):
                    # Found it!
                    endpoint_data = decoded_line.replace("data: ", "").strip()
                    session_id = endpoint_data.split("sessionId=")[1]
                    
                    print(f"\n[Agent] ✅ Handshake Successful!")
                    print(f"[Agent] Session ID: {session_id}")
                    
                    # Start the test sequence in a separate thread so we don't block the stream reader
                    threading.Thread(target=run_demo_sequence, args=(session_id,)).start()

                elif decoded_line.startswith("data:"):
                    # Handle normal messages (JSON-RPC)
                    try:
                        json_str = decoded_line.replace("data: ", "")
                        data = json.loads(json_str)
                        
                        print(f"\n[Agent] 📩 Received Message:")
                        print(json.dumps(data, indent=2))
                        
                        # Verify what we got back
                        if "result" in data and "content" in data["result"]:
                            content = data["result"]["content"][0]["text"]
                            print("\n[Agent] 📊 Test Results parsed:")
                            print(content[:500] + "..." if len(content) > 500 else content)
                            
                            print("\n[Agent] Demo Complete. Use Ctrl+C to exit.")
                            
                    except json.JSONDecodeError:
                        pass # Ignore heartbeat or raw data

def run_demo_sequence(session_id):
    """
    Simulates the AI Agent action
    """
    time.sleep(2) # Give the connection a moment to stabilize
    
    print(f"\n[Agent] 🤖 Requesting Accessibility Audit...")
    
    # JSON-RPC Payload
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "id": 1,
        "params": {
            "name": "browser_run_tests",
            "arguments": {
                "category": "accessibility",
                "url": "https://example.com"
            }
        }
    }
    
    try:
        res = requests.post(
            POST_URL, 
            params={"sessionId": session_id},
            json=payload
        )
        
        if res.status_code == 200:
            print("[Agent] Command sent! Waiting for browser response...")
        else:
            print(f"[Agent] ❌ Error sending command: {res.status_code} - {res.text}")
            
    except Exception as e:
        print(f"[Agent] Connection error during POST: {e}")

if __name__ == "__main__":
    print("--- Saturn Browser MCP Demo Agent (Raw Stream) ---")
    try:
        listen_for_events()
    except KeyboardInterrupt:
        print("\n[Agent] Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"[Agent] Fatal Error: {e}")
