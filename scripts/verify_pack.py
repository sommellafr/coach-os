from pathlib import Path
import hashlib, json
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "data/recipe-sources.json").read_text(encoding="utf-8"))
assert len(manifest["sources"]) == 31
for item in manifest["sources"]:
    path = root / item["file"]
    assert path.is_file(), path
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], path
for name in ["README.md", "VISION.md", "AGENTS.md", "START_HERE.md", "reference/coach-v21-original.md", "reference/coach-v21-normalized.html"]:
    assert (root / name).is_file(), name
catalog = json.loads((root / "data/recipes.json").read_text(encoding="utf-8"))
assert len(catalog["recipes"]) == 34
for source in manifest["sources"]:
    assert source["transcription_status"] == "visually_reviewed", source["source_id"]
    assert source["recipe_ids"], source["source_id"]
print("OK: 31 immagini integre e lette, 34 ricette censite, manifest e documenti presenti.")
