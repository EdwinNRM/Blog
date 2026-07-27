#!/usr/bin/env python3
"""
Decrypt a chat backup file.

Usage:
  python decrypt_chat.py _data/chat/backups/2026-07-26.enc

The script will prompt for the encryption key from BACKUP_ENCRYPTION_KEY,
or read it from the BACKUP_ENCRYPTION_KEY environment variable.
"""

import sys
import os
import json
from pathlib import Path

try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
except ImportError:
    print("Missing cryptography library. Install with: pip install cryptography")
    sys.exit(1)


def decrypt_file(filepath: str, key_hex: str) -> dict:
    key = bytes.fromhex(key_hex)
    with open(filepath, "rb") as f:
        data = f.read()

    if len(data) < 32:
        raise ValueError("File too small to be a valid encrypted backup")

    iv = data[:16]
    auth_tag = data[16:32]
    ciphertext = data[32:]

    cipher = Cipher(algorithms.AES(key), modes.GCM(iv, auth_tag))
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()

    return json.loads(plaintext.decode("utf-8"))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    filepath = sys.argv[1]

    if not os.path.isfile(filepath):
        print(f"File not found: {filepath}")
        sys.exit(1)

    key_hex = os.environ.get("BACKUP_ENCRYPTION_KEY")

    if not key_hex:
        key_hex = input("Enter encryption key (BACKUP_ENCRYPTION_KEY): ").strip()

    if not key_hex:
        print("No key provided.")
        sys.exit(1)

    try:
        data = decrypt_file(filepath, key_hex)
    except Exception as e:
        print(f"Decryption failed: {e}")
        print("Check that the key is correct and the file is a valid backup.")
        sys.exit(1)

    print(f"\n=== Chat Backup: {data.get('date', 'unknown')} ===")
    print(f"Total messages: {len(data.get('messages', []))}\n")

    for msg in data.get("messages", []):
        ts = msg.get("created_at", "")[11:16] if msg.get("created_at") else "??:??"
        nick = msg.get("nick", "???")
        text = msg.get("text", "")
        color = msg.get("color", "#000")

        if msg.get("type") and msg["type"] != "message":
            print(f"  *** {text}")
        else:
            print(f"  [{ts}] \033[{color_ansi(color)}m{nick}\033[0m: {text}")
        print()


def color_ansi(hex_color: str) -> str:
    """Return ANSI color code for supported hex colors."""
    ansi_map = {
        "#0000ff": "34",  # blue
        "#008000": "32",  # green
        "#ff0000": "31",  # red
        "#800080": "35",  # magenta
        "#8B4513": "33",  # yellow/brown
    }
    return ansi_map.get(hex_color.lower(), "0")


if __name__ == "__main__":
    main()
