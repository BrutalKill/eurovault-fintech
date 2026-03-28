"""
sha256_certifier.py — Contract Integrity Certification Module
EuroVault Digital Solutions

Provides functions to certify, verify, and audit contract integrity
using SHA-256 hashing, ensuring documents cannot be tampered with.
"""

import hashlib
import json
from datetime import datetime, timezone


def certify_contract(
    token: str,
    client_name: str,
    email: str,
    amount: str,
    timestamp: str,
    signer_ip: str,
) -> str:
    """
    Generate a SHA-256 certificate for a signed contract.
    
    The hash is computed from all critical fields, making it
    impossible to alter any field without changing the hash.
    
    Args:
        token:       Unique contract token
        client_name: Full name of the signer
        email:       Client email address
        amount:      Investment amount (as string)
        timestamp:   UTC timestamp of signing
        signer_ip:   IP address of the signer
    
    Returns:
        64-character hexadecimal SHA-256 hash
    
    Example:
        cert = certify_contract(
            "abc123", "Alex Grayson", "alex@example.com",
            "30000", "2026-03-28T10:00:00Z", "185.x.x.x"
        )
        # Returns: "ea85904db2d569f4972fcf43f1b91568..."
    """
    payload = f"{token}|{client_name}|{email}|{amount}|{timestamp}|{signer_ip}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def verify_contract(
    stored_hash: str,
    token: str,
    client_name: str,
    email: str,
    amount: str,
    timestamp: str,
    signer_ip: str,
) -> dict:
    """
    Verify a contract's integrity by recomputing its SHA-256 hash.
    
    Returns:
        {
            "valid":           bool,
            "stored_hash":     str,
            "computed_hash":   str,
            "verified_at":     str (UTC ISO timestamp),
            "tampering_detected": bool
        }
    """
    computed = certify_contract(token, client_name, email, amount, timestamp, signer_ip)
    is_valid  = computed == stored_hash

    return {
        "valid":              is_valid,
        "stored_hash":        stored_hash,
        "computed_hash":      computed,
        "verified_at":        datetime.now(timezone.utc).isoformat(),
        "tampering_detected": not is_valid,
        "message":            "✓ Contract integrity verified" if is_valid
                              else "⚠ TAMPERING DETECTED — hash mismatch",
    }


def generate_audit_report(contracts: list) -> dict:
    """
    Generate a batch audit report for multiple contracts.
    
    Args:
        contracts: List of contract dicts with all fields needed for verification
    
    Returns:
        Audit report with summary and per-contract results
    """
    results = []
    for c in contracts:
        result = verify_contract(
            c.get("cert_hash", ""),
            c.get("token", ""),
            c.get("client_name", ""),
            c.get("email", ""),
            c.get("amount", ""),
            c.get("timestamp", ""),
            c.get("signer_ip", ""),
        )
        result["contract_id"] = c.get("id", "unknown")
        results.append(result)

    valid_count   = sum(1 for r in results if r["valid"])
    invalid_count = len(results) - valid_count

    return {
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_contracts": len(results),
        "valid":           valid_count,
        "invalid":         invalid_count,
        "integrity_score": f"{(valid_count / len(results) * 100):.1f}%" if results else "N/A",
        "results":         results,
    }


if __name__ == "__main__":
    # Demo
    print("\n" + "="*60)
    print("  EuroVault Contract Certification Demo")
    print("="*60 + "\n")

    ts     = datetime.now(timezone.utc).isoformat()
    token  = "demo1234567890ab"
    name   = "Alex Grayson"
    email  = "alex.grayson@example.com"
    amount = "30000"
    ip     = "185.220.101.47"

    cert_hash = certify_contract(token, name, email, amount, ts, ip)
    print(f"  Contract:  {token}")
    print(f"  Client:    {name} <{email}>")
    print(f"  Amount:    €{amount}")
    print(f"  Signed at: {ts}")
    print(f"  Signer IP: {ip}")
    print(f"\n  SHA-256:   {cert_hash}")

    # Verify
    result = verify_contract(cert_hash, token, name, email, amount, ts, ip)
    print(f"\n  Verification: {result['message']}")

    # Tampering simulation
    tampered = verify_contract(cert_hash, token, "Alex TAMPERED", email, amount, ts, ip)
    print(f"  Tamper test:  {tampered['message']}\n")
