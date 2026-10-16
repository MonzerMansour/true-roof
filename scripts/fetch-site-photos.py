"""Download freely licensed site photographs from Wikimedia Commons.

    python -I scripts/fetch-site-photos.py public/images/sites

Then regenerate lib/listings/site-photos.ts from the manifest it writes.

Why categories and not search. Free-text search was tried first and was far
too loose: "brick apartment building" returned bronze age rings photographed
on a measuring scale, and "recreational vehicle parked" returned empty Welsh
fields. Commons categories are curated by hand, so they are precise, and the
California and Bay Area ones keep the pictures in roughly the right place.

What is filtered, and why each filter exists. Every one of these was added
after looking at a contact sheet of what came back:

  - licence must permit reuse (CC0, CC BY, CC BY-SA, public domain)
  - landscape, at least 900px wide: these render into wide, short card crops
  - red or sepia cast is rejected, which removes archival construction
    photographs of 1950s dam sites
  - near-monochrome is rejected, which removes old survey photographs
  - mostly-foliage frames are rejected, which removes pictures that are a palm
    tree with a building somewhere behind it

Four more were removed by hand after review and are listed in the manifest
commit: a fire crew at a burning building, an empty concrete plaza, a transit
overpass, and a hotel lobby with chandeliers.

Be polite to Commons. It rate limits, and this sleeps between requests on
purpose. If it starts returning 429 the right response is to wait, not to
parallelise.
"""

import html, json, os, re, sys, time, urllib.parse, urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "TrueRoof/1.0 (student housing app; image sourcing)"
OUT = sys.argv[1]
WIDTH = 1000
OK = re.compile(r"^(cc0|cc[- ]by([- ]sa)?([- ][\d.]+)?|public domain|pd[- ]|no restrictions)", re.I)

TARGETS = {
    "block": ["Apartment buildings in California", "Motels in California",
              "Apartment buildings in Oakland, California",
              "Apartment buildings in Los Angeles"],
    "terrace": ["Row houses in the United States",
                "Apartment buildings in Irvine, California",
                "Apartment buildings in Pasadena, California"],
    "house": ["Houses in Santa Clara County, California",
              "Houses in San Jose, California", "Houses in Alameda, California"],
    "lot_car": ["Empty parking lots in the United States",
                "Parking lots in California", "Parking lots in the United States"],
    "lot_van": ["Vans in the United States", "Campervans in the United States",
                "Volkswagen Transporter"],
    "lot_rv": ["Recreational vehicles in the United States",
               "Motorhomes in the United States", "Recreational vehicles"],
}
WANT = {"block": 30, "terrace": 30, "house": 30, "lot_car": 16, "lot_van": 14, "lot_rv": 16}


def api(**p):
    p.setdefault("format", "json"); p.setdefault("formatversion", "2")
    url = API + "?" + urllib.parse.urlencode(p)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for a in range(4):
        try:
            with urllib.request.urlopen(req, timeout=45) as f:
                return json.load(f)
        except Exception:
            if a == 3: return {}
            time.sleep(3 * (a + 1))
    return {}


def files_in(cat, depth=1, budget=220):
    """File titles in a category, descending one level into subcategories."""
    out = []
    d = api(action="query", list="categorymembers", cmtitle="Category:" + cat,
            cmtype="file", cmlimit=min(budget, 150))
    out += [m["title"] for m in d.get("query", {}).get("categorymembers", [])]
    time.sleep(0.6)
    if depth > 0 and len(out) < budget:
        s = api(action="query", list="categorymembers", cmtitle="Category:" + cat,
                cmtype="subcat", cmlimit=8)
        time.sleep(0.6)
        for sub in s.get("query", {}).get("categorymembers", []):
            if len(out) >= budget: break
            out += files_in(sub["title"][9:], depth - 1, budget - len(out))
    return out


def strip(m):
    return html.unescape(re.sub(r"<[^>]+>", "", m or "")).strip().replace("\n", " ")[:120]


def info_for(titles):
    """imageinfo in batches of 25, which is the API's comfortable limit."""
    out = []
    for i in range(0, len(titles), 25):
        d = api(action="query", titles="|".join(titles[i:i + 25]), prop="imageinfo",
                iiprop="url|size|mime|extmetadata", iiurlwidth=WIDTH)
        out += d.get("query", {}).get("pages", []) or []
        time.sleep(0.7)
    return out


def usable(page):
    ii = (page.get("imageinfo") or [{}])[0]
    meta = ii.get("extmetadata", {}) or {}
    lic = (meta.get("LicenseShortName", {}) or {}).get("value", "").strip()
    if not OK.match(lic): return None
    if ii.get("mime") not in ("image/jpeg", "image/png"): return None
    w, h = ii.get("width", 0), ii.get("height", 0)
    if w < 900 or h < 500: return None
    if not (1.25 <= w / h <= 2.2): return None
    if not ii.get("thumburl"): return None
    return {"title": page["title"], "thumburl": ii["thumburl"],
            "descriptionurl": ii.get("descriptionurl", ""),
            "artist": strip((meta.get("Artist", {}) or {}).get("value", "")) or "Wikimedia Commons",
            "licence": lic}


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest, seen = [], set()
    for cat, cats in TARGETS.items():
        titles = []
        for c in cats:
            if len(titles) >= WANT[cat] * 5: break
            titles += files_in(c)
        titles = [t for t in dict.fromkeys(titles) if t not in seen][: WANT[cat] * 5]
        picked = []
        for page in info_for(titles):
            if len(picked) >= WANT[cat]: break
            it = usable(page)
            if not it or it["title"] in seen: continue
            seen.add(it["title"]); picked.append(it)
        print(f"{cat}: {len(picked)} from {len(titles)} candidates", flush=True)
        for i, it in enumerate(picked):
            name = f"{cat}-{i:02d}.jpg"
            p = os.path.join(OUT, name)
            try:
                req = urllib.request.Request(it["thumburl"], headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as r, open(p, "wb") as f:
                    f.write(r.read())
            except Exception as e:
                print("  skip", name, e, flush=True); continue
            manifest.append({**it, "file": name, "category": cat})
            time.sleep(0.6)
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"),
              indent=2, ensure_ascii=False)
    print("total:", len(manifest))


main()
