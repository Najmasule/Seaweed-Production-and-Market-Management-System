import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVICE_PORTS = {
    "gateway": 8000,
    "farmers": 8001,
    "production": 8002,
    "inventory": 8003,
    "market": 8004,
    "reports": 8005,
}
DATABASES = {
    "gateway": "seaweed_gateway",
    "farmers": "seaweed_farmers",
    "production": "seaweed_production",
    "inventory": "seaweed_inventory",
    "market": "seaweed_market",
    "reports": "seaweed_reports",
}


def start_service(name: str, port: int) -> subprocess.Popen:
    env = os.environ.copy()
    env["SERVICE_NAME"] = name
    env["ALLOWED_HOSTS"] = "localhost,127.0.0.1"
    env["POSTGRES_HOST"] = "localhost"
    env["POSTGRES_PORT"] = "5432"
    env["POSTGRES_DB"] = DATABASES[name]
    env["POSTGRES_USER"] = "postgres"
    env["POSTGRES_PASSWORD"] = "12345"

    creationflags = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)

    return subprocess.Popen(
        [
            sys.executable,
            "manage.py",
            "runserver",
            f"0.0.0.0:{port}",
        ],
        cwd=str(ROOT),
        env=env,
        creationflags=creationflags,
    )


if __name__ == "__main__":
    processes = []
    try:
        for name, port in SERVICE_PORTS.items():
            print(f"Starting {name} on port {port}")
            processes.append(start_service(name, port))
            time.sleep(1)
        print("All services started. Press Ctrl+C to stop.")
        for proc in processes:
            proc.wait()
    except KeyboardInterrupt:
        for proc in processes:
            proc.terminate()
        print("Stopped all services.")
