#!/usr/bin/env python3
import json
import os
import base64
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "image_catalog.json"
OUT_DIR = ROOT / "frontend/public/images/splashj"
SIZE = "1280x720"
MODEL = "gpt-image-1"


def make_prompt(item: dict) -> str:
    title = item["title"]
    synonyms = ", ".join(item.get("synonyms", [])[:10])
    return (
        f"Create a realistic photo representing: {title}. "
        f"Context keywords: {synonyms}. "
        "Style: photorealistic travel/lifestyle photography, natural lighting, high detail, "
        "no text, no logos, no watermark, cinematic composition, 16:9 aspect ratio."
    )


def main() -> None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    client = OpenAI(api_key=api_key)
    items = json.loads(CATALOG.read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    total = len(items)
    for idx, item in enumerate(items, 1):
        out_path = OUT_DIR / item["filename"]
        if out_path.exists():
            print(f"[{idx}/{total}] skip {out_path.name}")
            continue

        prompt = make_prompt(item)
        result = client.images.generate(model=MODEL, size=SIZE, prompt=prompt)
        img_b64 = result.data[0].b64_json
        out_path.write_bytes(base64.b64decode(img_b64))
        print(f"[{idx}/{total}] wrote {out_path.name}")


if __name__ == "__main__":
    main()
