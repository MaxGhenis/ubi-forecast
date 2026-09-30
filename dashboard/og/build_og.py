"""Render the social preview image from the paper's headline number.

The number is read from paper/_variables.yml (written from the model run by build_assets.py), so the
image can't drift from the headline; test/og.test.js checks it. The file name carries the revision so
link-preview caches pick up a new image.

    python3 dashboard/og/build_og.py r3 "October 2026"
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
REV, AS_OF = sys.argv[1], sys.argv[2]
V = dict(re.findall(r'^(\w+): "([^"]*)"$', (ROOT / "paper" / "_variables.yml").read_text(), re.M))
html = (HERE / "og.template.html").read_text().replace("{{USA_2040}}", V["usa_2040"]).replace("{{AS_OF}}", AS_OF)
out = HERE / f"og-image-{REV}.png"
with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
    f.write(html)
chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                "--virtual-time-budget=4000", "--window-size=1200,630", f"--screenshot={out}", f"file://{f.name}"],
               check=True, capture_output=True)
(HERE / "og.json").write_text(f'{{"file": "og-image-{REV}.png", "usa_2040": "{V["usa_2040"]}", "as_of": "{AS_OF}"}}\n')
print("wrote", out.name, "with", V["usa_2040"])
