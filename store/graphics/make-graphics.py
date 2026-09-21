"""Builds the Play Store icon and feature graphics.

Renders feature.html with headless Edge (which shapes Arabic correctly) and
resizes assets/icon.png. Run from anywhere: python store/graphics/make-graphics.py
"""
import os
import struct
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    return struct.unpack('>II', head[16:24])


def render(fragment, out, width, height):
    url = 'file:///' + os.path.join(HERE, 'feature.html').replace('\\', '/') + fragment
    subprocess.run(
        [EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
         f'--window-size={width},{height}', f'--screenshot={out}', url],
        check=True, capture_output=True, timeout=90,
    )
    if png_size(out) != (width, height):
        sys.exit(f'{out} is {png_size(out)}, expected {(width, height)}')


# App icon: 512x512, 32-bit PNG, full-bleed square (Play applies its own mask).
icon = Image.open(os.path.join(ROOT, 'assets', 'icon.png')).convert('RGBA').resize((512, 512), Image.LANCZOS)
icon.save(os.path.join(HERE, 'icon-512.png'), optimize=True)

render('', os.path.join(HERE, 'feature-free.png'), 1024, 500)
render('#premium', os.path.join(HERE, 'feature-premium.png'), 1024, 500)

for name in ('icon-512.png', 'feature-free.png', 'feature-premium.png'):
    p = os.path.join(HERE, name)
    print(name, png_size(p), os.path.getsize(p) // 1024, 'KB')
