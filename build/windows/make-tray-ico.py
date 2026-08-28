#!/usr/bin/env python3
"""Pack the brand pack's tray PNGs into the two .ico files main.go embeds.

The 2b asset pack ships hand-tuned tray art per size (at 16-24px a 1px gap
opens between disc and horizon, so the sizes are drawn, never scaled) and a
ready-made nightcap-tray-white.ico -- but no .ico for the inactive/paused
variant, only PNGs. systray wants .ico bytes on Windows, so we build both here
from the same PNG sources: a matched pair beats one packed file and one
hand-rolled one.

No scaling and no re-encoding happens: each PNG goes into the .ico verbatim
(Vista+ reads PNG-payload icons), so the drawn pixels are the shipped pixels.

    python build/windows/make-tray-ico.py

Re-run it if the art in assets-2b/png/ changes.
"""

import pathlib
import struct
import sys

SIZES = (16, 20, 24, 32, 48)
ROOT = pathlib.Path(__file__).resolve().parents[2]
PNGS = ROOT / "assets-2b" / "png"
OUT = ROOT / "build" / "windows"

ICONS = {
    "tray-active.ico": "tray-white-{}.png",
    "tray-inactive.ico": "tray-white-inactive-{}.png",
}


def png_size(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    return struct.unpack(">II", data[16:24])


def build_ico(sources: list[pathlib.Path]) -> bytes:
    images = []
    for path in sources:
        data = path.read_bytes()
        width, height = png_size(data)
        if width != height:
            raise ValueError(f"{path.name} is {width}x{height}, tray art must be square")
        images.append((width, data))

    # ICONDIR: reserved, type 1 (icon), image count.
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = len(header) + 16 * len(images)
    entries, payloads = [], []
    for width, data in images:
        entries.append(
            struct.pack(
                "<BBBBHHII",
                width if width < 256 else 0,  # 0 means 256
                width if width < 256 else 0,
                0,  # palette size, 0 for truecolour
                0,  # reserved
                1,  # colour planes
                32,  # bits per pixel
                len(data),
                offset,
            )
        )
        payloads.append(data)
        offset += len(data)
    return header + b"".join(entries) + b"".join(payloads)


def main() -> int:
    for out_name, pattern in ICONS.items():
        sources = [PNGS / pattern.format(size) for size in SIZES]
        missing = [p.name for p in sources if not p.exists()]
        if missing:
            print(f"{out_name}: missing source art: {', '.join(missing)}", file=sys.stderr)
            return 1
        blob = build_ico(sources)
        (OUT / out_name).write_bytes(blob)
        print(f"{out_name}: {len(blob)} bytes, {', '.join(str(s) for s in SIZES)}px")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
