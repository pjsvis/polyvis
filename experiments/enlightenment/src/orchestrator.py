import subprocess
import time
import signal
import sys
from pathlib import Path

# --- CONFIGURATION ---
BASE_DIR = Path(__file__).parent.parent
VECTORS_DIR = BASE_DIR / "vectors"
BIN_PATH = BASE_DIR / "llama.cpp/build/bin/llama-server"

AGENTS = [
    {
        "name": "SCOUT (Phi-3.5)",
        "port": 8082,
        "model": "Phi-3.5-mini-instruct-Q4_K_M.gguf",
        "vector": None, # Natural state
        "ctx": 4096
    },
    {
        "name": "ARCHITECT (Llama-3)",
        "port": 8083,
        "model": "Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
        "vector": "enlightenment_vector_v2.gguf", # The Accountant (-0.3)
        "scale": "-0.3",
        "ctx": 8192
    },
    {
        "name": "AUDITOR (Olmo-3)",
        "port": 8084,
        "model": "Olmo-3-7B-Think-Q4_K_M.gguf",
        "vector": None, # Needs raw thinking power
        "ctx": 8192
    }
]

processes = []

def start_agent(agent):
    print(f"🚀 Launching {agent['name']} on Port {agent['port']}...")
    
    cmd = [
        str(BIN_PATH),
        "-m", str(VECTORS_DIR / agent['model']),
        "--port", str(agent['port']),
        "--ctx-size", str(agent['ctx']),
        "--log-disable",
        "--n-gpu-layers", "99" # Push to Metal
    ]
    
    if agent["vector"]:
        vec_path = VECTORS_DIR / agent["vector"]
        cmd.extend(["--control-vector-scaled", f"{vec_path}:{agent['scale']}"])

    # Redirect stdout to avoid console clutter, keep stderr for errors
    p = subprocess.Popen(cmd, stdout=subprocess.DEVNULL)
    processes.append(p)

def cleanup(signum, frame):
    print("\n\n🛑 Shutting down the Triad...")
    for p in processes:
        p.terminate()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, cleanup)
    
    print("=== POLYVIS TRIAD ORCHESTRATOR ===")
    
    for agent in AGENTS:
        start_agent(agent)
        # Stagger start to avoid VRAM spike
        time.sleep(2) 

    print("\n✅ All Agents Online. Press Ctrl+C to stop.")
    signal.pause()