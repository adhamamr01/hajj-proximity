"""Checks store/listing.md against Google Play's field limits.

Run: python store/check-listing.py
Limits: title 30, short description 80, full description 4000 characters.
"""
import re
import sys
from pathlib import Path

LIMITS = {"Title": 30, "Short description": 80, "Full description": 4000}

text = Path(__file__).with_name("listing.md").read_text(encoding="utf-8")
listing = None
lang = None
failed = False

# Walk the file: "## <app>" sets the listing, "### <lang>" the language, and
# each "**Field**" is followed by a fenced block holding the value.
for match in re.finditer(r"^## ([^\n]+)$|^### ([^\n]+)$|\*\*([^*\n]+)\*\*\s*```\n(.*?)\n```", text, re.M | re.S):
    if match.group(1):
        listing = match.group(1).split(" — ")[0]
    elif match.group(2):
        lang = match.group(2)
    else:
        field, value = match.group(3), match.group(4)
        limit = LIMITS.get(field)
        if limit is None:
            continue
        size = len(value)
        ok = size <= limit
        failed |= not ok
        print(f"{'OK  ' if ok else 'FAIL'} {listing} / {lang} / {field}: {size}/{limit}")

sys.exit(1 if failed else 0)
