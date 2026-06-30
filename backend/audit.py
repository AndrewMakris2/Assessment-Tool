import json
import logging
from datetime import datetime
from pathlib import Path

LOG_FILE = Path(__file__).parent / "audit.log"

logger = logging.getLogger("audit")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.FileHandler(str(LOG_FILE))
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)


def log_event(event_type: str, actor: str = "", details: dict = None, ip: str = ""):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event_type,
        "actor": actor,
        "ip": ip,
    }
    if details:
        entry["details"] = details
    logger.info(json.dumps(entry))
