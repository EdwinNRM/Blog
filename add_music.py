#!/usr/bin/env python3
"""
add_music.py - Adiciona musicas MP3 ao player do blog.

Uso:
    python add_music.py assets/audio/musica.mp3
    python add_music.py assets/audio/*.mp3
    python add_music.py assets/audio/ --scan
"""

import sys
import os
import glob
import yaml

MUSIC_DIR = "assets/audio"
MUSIC_YML = "_data/music.yml"


def get_metadata(filepath):
    """Extrai metadados do arquivo MP3 usando mutagen."""
    from mutagen.mp3 import MP3
    from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC

    audio = MP3(filepath, ID3=ID3)
    tags = audio.get("ID3", ID3())

    title = ""
    artist = ""
    album = ""
    year = ""

    if tags.get("TIT2"):
        title = str(tags["TIT2"])
    if tags.get("TPE1"):
        artist = str(tags["TPE1"])
    if tags.get("TALB"):
        album = str(tags["TALB"])
    if tags.get("TDRC"):
        year = str(tags["TDRC"])

    if not title:
        title = os.path.splitext(os.path.basename(filepath))[0]
        title = title.replace("-", " ").replace("_", " ").title()

    return {
        "title": title,
        "artist": artist or "Unknown",
        "album": album or "Unknown",
        "year": year or "Unknown",
        "file": os.path.basename(filepath),
    }


def load_existing():
    """Carrega musicas ja existentes no music.yml."""
    if not os.path.exists(MUSIC_YML):
        return []

    with open(MUSIC_YML, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    return data if isinstance(data, list) else []


def save_music(music_list):
    """Salva a lista de musicas no music.yml."""
    os.makedirs(os.path.dirname(MUSIC_YML), exist_ok=True)

    with open(MUSIC_YML, "w", encoding="utf-8") as f:
        yaml.dump(
            music_list,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )


def scan_directory():
    """Escaneia todos os MP3s na pasta assets/audio."""
    if not os.path.exists(MUSIC_DIR):
        print(f"Pasta '{MUSIC_DIR}' nao encontrada.")
        return []

    mp3s = glob.glob(os.path.join(MUSIC_DIR, "*.mp3"))
    if not mp3s:
        print(f"Nenhum arquivo MP3 encontrado em '{MUSIC_DIR}/'.")
        return []

    return sorted(mp3s)


def main():
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python add_music.py assets/audio/musica.mp3")
        print("  python add_music.py assets/audio/*.mp3")
        print("  python add_music.py --scan")
        sys.exit(1)

    existing = load_existing()
    existing_files = {m["file"] for m in existing}
    new_tracks = []

    if sys.argv[1] == "--scan":
        mp3s = scan_directory()
    else:
        mp3s = []
        for arg in sys.argv[1:]:
            matches = glob.glob(arg)
            mp3s.extend(matches)

    if not mp3s:
        print("Nenhum arquivo MP3 encontrado.")
        sys.exit(1)

    for mp3 in mp3s:
        filename = os.path.basename(mp3)

        if filename in existing_files:
            print(f"  [skip] {filename} (ja existe no music.yml)")
            continue

        if not os.path.exists(mp3):
            print(f"  [erro] {filename} (arquivo nao encontrado)")
            continue

        meta = get_metadata(mp3)
        new_tracks.append(meta)
        print(f"  [add]  {meta['title']} - {meta['artist']} ({meta['file']})")

    if new_tracks:
        existing.extend(new_tracks)
        save_music(existing)
        print(f"\n{len(new_tracks)} musica(s) adicionada(s) ao {MUSIC_YML}")
        print(f"Total: {len(existing)} musicas no player.")
    else:
        print("\nNenhuma musica nova para adicionar.")


if __name__ == "__main__":
    main()
