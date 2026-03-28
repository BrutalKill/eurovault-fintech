"""
honeypot_engine.py — Standalone Honeypot & Intrusion Detection Module
EuroVault Digital Solutions · Security Division

Monitors 20+ attack vectors and classifies them by risk level.
Can run standalone or integrated into the FastAPI middleware.

Usage:
    python honeypot_engine.py --simulate   # Run stress test simulation
    python honeypot_engine.py --monitor    # Start real-time monitoring
"""

import hashlib
import json
import random
import time
from datetime import datetime, timezone
from typing import Optional


# ── Risk Classification ───────────────────────────────────────────────────────
HONEYPOT_PATHS = {
    # CRITICAL — Immediate permanent ban
    "critical": [
        "/.env", "/.env.local", "/.env.production",
        "/.git/config", "/.git/HEAD",
        "/etc/passwd", "/etc/shadow", "/proc/self/environ",
        "/phpmyadmin", "/pma", "/myadmin",
    ],
    # HIGH — Rate limit + alert
    "high": [
        "/wp-admin", "/wp-login.php", "/wp-admin/setup-config.php",
        "/backup.sql", "/database.sql", "/dump.sql", "/db.sqlite",
        "/shell.php", "/cmd.php", "/webshell.php",
        "/admin", "/administrator", "/admin-panel",
    ],
    # MEDIUM — Block + log
    "medium": [
        "/xmlrpc.php", "/config.php", "/config.json",
        "/api/config", "/api/v1/admin",
        "/debug", "/console", "/actuator/env",
    ],
    # LOW — Log only
    "low": [
        "/server-status", "/robots.txt", "/.DS_Store",
        "/sitemap.xml", "/crossdomain.xml",
    ],
}

ATTACK_TYPES = {
    ".env":         "Environment File Exposure",
    "phpmyadmin":   "phpMyAdmin Probe",
    "wp-admin":     "WordPress Admin Brute Force",
    "wp-login":     "WordPress Login Attack",
    "backup.sql":   "Database Backup Exposure",
    "database.sql": "SQL Database Dump Access",
    "shell.php":    "Remote Shell Upload",
    ".git":         "Git Repository Leak",
    "passwd":       "LFI - System File Access",
    "xmlrpc":       "XML-RPC Exploit",
    "config.php":   "Config File Exposure",
    "sqlmap":       "SQL Injection Probe",
    "eval":         "Remote Code Execution",
    "proc/self":    "Process Enumeration (LFI)",
    "admin":        "Admin Panel Scan",
}

MITIGATIONS = {
    "critical": "IP PERMANENTLY BANNED",
    "high":     "IP RATE LIMITED + ALERTED",
    "medium":   "REQUEST BLOCKED",
    "low":      "LOGGED",
}


def get_risk_level(path: str) -> str:
    """Classify a path by risk level."""
    pl = path.lower()
    for level, paths in HONEYPOT_PATHS.items():
        if any(p.lower() in pl for p in paths):
            return level
    # Generic suspicious patterns
    if any(ext in pl for ext in [".sql", ".bak", ".backup", ".old"]):
        return "high"
    if any(tool in pl for tool in ["sqlmap", "nikto", "nmap"]):
        return "critical"
    return "low"


def get_attack_type(path: str) -> str:
    """Identify the attack type from the path."""
    pl = path.lower()
    for key, label in ATTACK_TYPES.items():
        if key in pl:
            return label
    return "Suspicious Access"


def get_mitigation(risk_level: str) -> str:
    return MITIGATIONS.get(risk_level, "LOGGED")


def generate_intrusion_log(
    path: str,
    ip: str,
    method: str = "GET",
    user_agent: str = "",
    source: str = "middleware",
) -> dict:
    """Generate a structured intrusion log entry."""
    risk = get_risk_level(path)
    ts = datetime.now(timezone.utc).isoformat()

    # SHA-256 fingerprint of the attack
    fingerprint = hashlib.sha256(
        f"{ts}|{ip}|{path}|{method}".encode()
    ).hexdigest()[:16]

    return {
        "ts":           ts,
        "path":         path,
        "method":       method,
        "ip":           ip,
        "user_agent":   user_agent,
        "source":       source,
        "risk_level":   risk,
        "attack_type":  get_attack_type(path),
        "mitigation":   get_mitigation(risk),
        "fingerprint":  fingerprint,
    }


# ── Stress Test Simulator ─────────────────────────────────────────────────────
ATTACK_VECTORS = [
    # (path, method, tool_ua)
    ("/.env",                         "GET",  "Expanse/3.0 Palo Alto Networks"),
    ("/wp-admin/admin-ajax.php",       "POST", "Mozilla/5.0 Nikto/2.1.6"),
    ("/phpmyadmin/index.php",          "GET",  "sqlmap/1.7.7#stable"),
    ("/backup.sql",                    "GET",  "python-requests/2.31.0"),
    ("/database.sql",                  "GET",  "curl/7.88.1"),
    ("/.git/config",                   "GET",  "gittools/1.0.0"),
    ("/etc/passwd",                    "GET",  "Zgrab/0.x masscan"),
    ("/wp-login.php",                  "POST", "WPScan v3.8.22"),
    ("/xmlrpc.php",                    "POST", "WordPress/6.4 xmlrpc-c"),
    ("/api/config.json",               "GET",  "Go-http-client/1.1"),
    ("/shell.php",                     "POST", "curl/8.0.1 (RCE scanner)"),
    ("/proc/self/environ",             "GET",  "masscan/1.3"),
    ("/admin-panel",                   "GET",  "python-requests/2.28.0"),
    ("/wp-content/uploads/shell.php",  "POST", "Mozilla/5.0 automated"),
    ("/config.php.bak",                "GET",  "ZmEu scanner"),
    ("/server-status",                 "GET",  "Googlebot/2.1"),
    ("/debug/console",                 "GET",  "Mozilla/5.0 DevTools"),
    ("/.htaccess",                     "GET",  "Wget/1.21.4"),
    ("/dump.sql",                      "GET",  "curl/8.4.0"),
    ("/api/v1/users/admin",            "GET",  "PostmanRuntime/7.36.0"),
]

FAKE_IPS = [
    "185.220.101.47", "194.165.16.11", "45.142.212.55",
    "162.247.74.27",  "198.54.117.200", "91.108.4.171",
    "5.188.210.33",   "176.10.104.240", "89.234.157.254",
    "171.25.193.25",  "51.77.135.89",   "109.70.100.28",
    "192.42.116.16",  "185.100.87.202", "37.187.129.166",
    "77.81.247.144",  "141.94.244.91",  "82.221.131.21",
    "218.92.0.56",    "103.75.190.11",
]


def run_stress_test(delay: float = 0.3, verbose: bool = True) -> list:
    """
    Simulate 20 different attack vectors with realistic data.
    Returns a list of intrusion log entries.
    """
    results = []
    print("\n" + "=" * 60)
    print("  EuroVault Security Stress Test — Starting...")
    print("  Simulating 20 attack vectors")
    print("=" * 60 + "\n")

    for i, (path, method, ua) in enumerate(ATTACK_VECTORS):
        ip = FAKE_IPS[i % len(FAKE_IPS)]
        log = generate_intrusion_log(path, ip, method, ua, source="stress_test")
        results.append(log)

        if verbose:
            risk_colors = {
                "critical": "\033[35m",   # Purple
                "high":     "\033[31m",   # Red
                "medium":   "\033[33m",   # Yellow
                "low":      "\033[34m",   # Blue
            }
            reset = "\033[0m"
            color = risk_colors.get(log["risk_level"], "")

            print(f"  [{i+1:02d}] {color}[{log['risk_level'].upper():8}]{reset} "
                  f"{method:4} {path:40} from {ip}")
            print(f"       Attack: {log['attack_type']}")
            print(f"       Action: {log['mitigation']}\n")

        time.sleep(delay)

    print("=" * 60)
    print(f"  Stress Test Complete — {len(results)} vectors simulated")
    print(f"  Critical: {sum(1 for r in results if r['risk_level'] == 'critical')}")
    print(f"  High:     {sum(1 for r in results if r['risk_level'] == 'high')}")
    print(f"  Medium:   {sum(1 for r in results if r['risk_level'] == 'medium')}")
    print(f"  Low:      {sum(1 for r in results if r['risk_level'] == 'low')}")
    print("=" * 60 + "\n")

    return results


def export_logs(logs: list, filename: Optional[str] = None) -> str:
    """Export intrusion logs to JSON file."""
    if not filename:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"stress_test_{ts}.json"

    with open(filename, "w") as f:
        json.dump(
            {"generated_at": datetime.now().isoformat(), "total": len(logs), "logs": logs},
            f, indent=2
        )
    print(f"  Logs exported to: {filename}")
    return filename


if __name__ == "__main__":
    import sys
    if "--simulate" in sys.argv or len(sys.argv) == 1:
        logs = run_stress_test(delay=0.2, verbose=True)
        if "--export" in sys.argv:
            export_logs(logs)
    elif "--json" in sys.argv:
        logs = run_stress_test(delay=0, verbose=False)
        print(json.dumps(logs, indent=2))
