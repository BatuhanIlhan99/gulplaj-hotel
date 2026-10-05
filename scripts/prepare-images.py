"""Generate lightweight JPEG previews, keeping original photographs intact."""
from pathlib import Path
from PIL import Image, ImageOps
import re

root = Path(__file__).resolve().parents[1] / 'dist'
index = root / 'index.html'
html = index.read_text(encoding='utf-8')
original_bytes = 0
preview_bytes = 0
count = 0

def prepare(match):
    global original_bytes, preview_bytes, count
    tag = match.group(0)
    source = re.search(r'\bsrc="(\./assets/[^"?]+\.jpg)"', tag)
    if not source or '/previews/' in source[1]:
        return tag
    original = root / source[1][2:]
    relative = Path(source[1][2:]).relative_to('assets')
    preview = root / 'assets' / 'previews' / relative
    preview.parent.mkdir(parents=True, exist_ok=True)
    limit = 1600 if 'hero-image' in tag else 960
    with Image.open(original) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        image.save(preview, 'JPEG', quality=82, optimize=True, progressive=False)
    original_bytes += original.stat().st_size
    preview_bytes += preview.stat().st_size
    count += 1
    tag = tag.replace(source[0], f'src="./assets/previews/{relative.as_posix()}" data-original="{source[1]}"')
    # Small gallery previews load reliably even in embedded mobile browsers.
    return tag.replace('loading="lazy"', 'loading="eager"') if '/rooms/' in source[1] or '/bathrooms/' in source[1] or '/general/' in source[1] or '/exterior/' in source[1] else tag

html = re.sub(r'<img\b[^>]*>', prepare, html)
html = html.replace('styles.css?v=courtyard-design-5', 'styles.css?v=mobile-photos-6')
html = html.replace('src="./site.js"', 'src="./site.js?v=mobile-photos-6"')
index.write_text(html, encoding='utf-8')
print(f'{count} image references: {original_bytes / 1024 / 1024:.1f} MB originals -> {preview_bytes / 1024 / 1024:.1f} MB previews')
