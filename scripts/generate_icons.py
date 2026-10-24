import zlib
import struct
import math
import os

def create_png(width, height, get_pixel_func):
    """
    Generate valid PNG bytes using only Python standard library (zlib, struct).
    """
    # 8-byte PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0) # 8-bit RGBA
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc

    # Scanlines
    raw_scanlines = bytearray()
    for y in range(height):
        raw_scanlines.append(0) # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_scanlines.extend((r, g, b, a))

    # IDAT chunk
    compressed = zlib.compress(bytes(raw_scanlines), 9)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    idat_chunk = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc

    # IEND chunk
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    iend_chunk = struct.pack('>I', 0) + b'IEND' + iend_crc

    return png_signature + ihdr_chunk + idat_chunk + iend_chunk


def draw_icon_pixel(x, y, w, h, is_maskable=False):
    # Normalized coordinates 0 to 1
    nx = x / w
    ny = y / h

    # Corner radius check for non-maskable
    if not is_maskable:
        corner_r = 0.22
        dx = max(0, abs(nx - 0.5) - (0.5 - corner_r))
        dy = max(0, abs(ny - 0.5) - (0.5 - corner_r))
        if math.hypot(dx, dy) > corner_r:
            return (0, 0, 0, 0) # Transparent outside rounded corner

    # Background gradient: Royal Blue #2563EB to Deep Blue #1D4ED8
    bg_r = int(37 + (29 - 37) * ny)
    bg_g = int(99 + (78 - 99) * ny)
    bg_b = int(235 + (216 - 235) * ny)

    # Scale content within safe zone
    # If maskable, safe zone is center 80% (0.1 to 0.9)
    scale = 0.72 if is_maskable else 0.82
    cx = (nx - 0.5) / scale + 0.5
    cy = (ny - 0.5) / scale + 0.5

    # Manga page white card
    card_l, card_r = 0.18, 0.82
    card_t, card_b = 0.16, 0.84
    if card_l <= cx <= card_r and card_t <= cy <= card_b:
        # Check rounded corners of card
        rc = 0.04
        cdx = max(0, abs(cx - 0.5) - ((card_r - card_l)/2 - rc))
        cdy = max(0, abs(cy - 0.5) - ((card_b - card_t)/2 - rc))
        if math.hypot(cdx, cdy) <= rc:
            # Top panel
            p1_l, p1_r = 0.23, 0.77
            p1_t, p1_b = 0.21, 0.44
            if p1_l <= cx <= p1_r and p1_t <= cy <= p1_b:
                # Panel border stroke
                if cx <= p1_l + 0.015 or cx >= p1_r - 0.015 or cy <= p1_t + 0.015 or cy >= p1_b - 0.015:
                    return (30, 41, 59, 255) # Dark slate border
                # Panel fill
                return (241, 245, 249, 255)

            # Dashed cutting line (Red)
            if 0.48 <= cy <= 0.50 and 0.18 <= cx <= 0.82:
                dash_cycle = int(cx * 40) % 2
                if dash_cycle == 0:
                    return (239, 68, 68, 255) # Red cut line

            # Bottom panel
            p2_l, p2_r = 0.23, 0.77
            p2_t, p2_b = 0.54, 0.79
            if p2_l <= cx <= p2_r and p2_t <= cy <= p2_b:
                if cx <= p2_l + 0.015 or cx >= p2_r - 0.015 or cy <= p2_t + 0.015 or cy >= p2_b - 0.015:
                    return (30, 41, 59, 255) # Dark slate border
                return (248, 250, 252, 255)

            # Card background
            return (255, 255, 255, 255)

    # Scissors icon (Gold and Silver) floating in lower-right
    # Center around (0.68, 0.49)
    sx = (cx - 0.68) * 4
    sy = (cy - 0.49) * 4
    dist = math.hypot(sx, sy)
    if dist < 0.38:
        # Scissor handle / blades
        return (245, 158, 11, 255) # Amber gold

    return (bg_r, bg_g, bg_b, 255)


os.makedirs('public', exist_ok=True)

# Generate 192x192
print("Generating 192x192 PNG...")
p192 = create_png(192, 192, lambda x, y, w, h: draw_icon_pixel(x, y, w, h, False))
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(p192)

# Generate 512x512
print("Generating 512x512 PNG...")
p512 = create_png(512, 512, lambda x, y, w, h: draw_icon_pixel(x, y, w, h, False))
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(p512)

# Generate 512x512 Maskable (full bleed background with 15% safe margin)
print("Generating 512x512 Maskable PNG...")
pmask = create_png(512, 512, lambda x, y, w, h: draw_icon_pixel(x, y, w, h, True))
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(pmask)

# Generate Apple Touch Icon 180x180
print("Generating 180x180 Apple Touch Icon...")
p180 = create_png(180, 180, lambda x, y, w, h: draw_icon_pixel(x, y, w, h, True))
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(p180)

# Generate 64x64 favicon
p64 = create_png(64, 64, lambda x, y, w, h: draw_icon_pixel(x, y, w, h, False))
with open('public/favicon.ico', 'wb') as f:
    f.write(p64)

print("All PWA icons generated successfully!")
