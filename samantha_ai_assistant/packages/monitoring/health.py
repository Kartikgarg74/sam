import psutil
import requests
from typing import List, Dict


def get_system_health() -> Dict:
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
    }


def check_endpoints(endpoints: List[str]) -> Dict[str, bool]:
    status = {}
    for url in endpoints:
        try:
            r = requests.get(url, timeout=2)
            status[url] = r.status_code == 200
        except Exception:
            status[url] = False
    return status
