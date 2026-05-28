from pathlib import Path

from PIL import Image, ImageColor, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "print-assets"
OUTPUT_DIR.mkdir(exist_ok=True)

FRONT_SOURCE = ROOT / "public" / "little-legends-reading-hero-family.png"
BACK_SOURCE = ROOT / "public" / "superhero-name-kids.png"
LOGO_SOURCE = ROOT / "public" / "inspiration" / "magic-reference.png"

PREVIEW_PATH = OUTPUT_DIR / "lulu-hardback-cover-draft.png"
PDF_PATH = OUTPUT_DIR / "lulu-hardback-cover-draft.pdf"
WEBSITE_URL = "https://www.littlelegendsstory.com"

# Lulu template values from yvrddev-cover-template.pdf
DPI = 300
TOTAL_W_IN = 25.38
TOTAL_H_IN = 10.02
WRAP_IN = 0.625
PANEL_W_IN = 11.94
SPINE_W_IN = 0.25

TOTAL_W = round(TOTAL_W_IN * DPI)
TOTAL_H = round(TOTAL_H_IN * DPI)
WRAP = round(WRAP_IN * DPI)
PANEL_W = round(PANEL_W_IN * DPI)
SPINE_W = round(SPINE_W_IN * DPI)

BACK_LEFT = WRAP
BACK_RIGHT = BACK_LEFT + PANEL_W
SPINE_LEFT = BACK_RIGHT
SPINE_RIGHT = SPINE_LEFT + SPINE_W
FRONT_LEFT = SPINE_RIGHT
FRONT_RIGHT = FRONT_LEFT + PANEL_W
PANEL_TOP = WRAP
PANEL_BOTTOM = TOTAL_H - WRAP


def font(size: int, bold: bool = False):
    candidates = [
        Path(r"C:\Windows\Fonts\georgiab.ttf" if bold else r"C:\Windows\Fonts\georgia.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def cover_crop(image: Image.Image, target_w: int, target_h: int, focus_x: float, focus_y: float):
    source_ratio = image.width / image.height
    target_ratio = target_w / target_h

    if source_ratio > target_ratio:
        crop_h = image.height
        crop_w = round(crop_h * target_ratio)
    else:
        crop_w = image.width
        crop_h = round(crop_w / target_ratio)

    max_left = image.width - crop_w
    max_top = image.height - crop_h
    left = round(max_left * focus_x)
    top = round(max_top * focus_y)
    return image.crop((left, top, left + crop_w, top + crop_h)).resize((target_w, target_h), Image.LANCZOS)


def print_boost(image: Image.Image):
    boosted = ImageEnhance.Brightness(image).enhance(1.24)
    boosted = ImageEnhance.Color(boosted).enhance(1.28)
    boosted = ImageEnhance.Contrast(boosted).enhance(1.12)
    boosted = ImageEnhance.Sharpness(boosted).enhance(1.08)
    return boosted


def add_vertical_gradient(base: Image.Image, box: tuple[int, int, int, int], top_alpha: int, bottom_alpha: int):
    x0, y0, x1, y1 = box
    overlay = Image.new("RGBA", (x1 - x0, y1 - y0), (8, 11, 36, 0))
    pixels = overlay.load()
    for y in range(overlay.height):
        alpha = round(top_alpha + (bottom_alpha - top_alpha) * (y / max(1, overlay.height - 1)))
        for x in range(overlay.width):
            pixels[x, y] = (8, 11, 36, alpha)
    base.alpha_composite(overlay, (x0, y0))


def gradient_pill(size: tuple[int, int]):
    width, height = size
    pill = Image.new("RGBA", size, (0, 0, 0, 0))
    gradient = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = gradient.load()
    colours = [(255, 245, 203), (255, 224, 138), (255, 213, 107)]
    for x in range(width):
        position = x / max(1, width - 1)
        if position < 0.48:
            ratio = position / 0.48
            start, end = colours[0], colours[1]
        else:
            ratio = (position - 0.48) / 0.52
            start, end = colours[1], colours[2]
        colour = tuple(round(start[i] + (end[i] - start[i]) * ratio) for i in range(3))
        for y in range(height):
            pixels[x, y] = (*colour, 255)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=height // 2, fill=255)
    pill.paste(gradient, (0, 0), mask)
    draw = ImageDraw.Draw(pill)
    draw.rounded_rectangle((2, 2, width - 3, height - 3), radius=height // 2, outline=(255, 248, 220, 250), width=6)
    return pill


def logo_heart():
    source = Image.open(LOGO_SOURCE).convert("RGBA")
    crop = source.crop((54, 42, 140, 132)).resize((118, 124), Image.LANCZOS)
    pixels = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            red, green, blue, _ = pixels[x, y]
            luminance = (red * 0.299) + (green * 0.587) + (blue * 0.114)
            alpha = max(0, min(255, round((luminance - 18) * 3.2)))
            pixels[x, y] = (red, green, blue, alpha)
    return crop


def qr_code_image(value: str, size: int):
    qr = QrCodeWidget(value)
    qr.qr.make()
    module_count = qr.qr.getModuleCount()
    quiet_modules = 4
    total_modules = module_count + (quiet_modules * 2)
    module_size = max(1, size // total_modules)
    image_size = module_size * total_modules
    qr_img = Image.new("RGB", (image_size, image_size), "white")
    draw = ImageDraw.Draw(qr_img)

    for row in range(module_count):
        for col in range(module_count):
            if qr.qr.isDark(row, col):
                x0 = (col + quiet_modules) * module_size
                y0 = (row + quiet_modules) * module_size
                draw.rectangle((x0, y0, x0 + module_size - 1, y0 + module_size - 1), fill="black")

    return qr_img.resize((size, size), Image.Resampling.NEAREST).convert("RGBA")


def qr_card(size: tuple[int, int]):
    width, height = size
    card = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=34, fill=(255, 255, 255, 252))
    draw.rounded_rectangle((8, 8, width - 9, height - 9), radius=28, outline=(255, 223, 130, 255), width=6)

    qr_size = 310
    qr = qr_code_image(WEBSITE_URL, qr_size)
    card.alpha_composite(qr, ((width - qr_size) // 2, 42))

    title = "Scan to create yours"
    small = "littlelegendsstory.com"
    title_font = font(34, bold=True)
    small_font = font(24)
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    small_bbox = draw.textbbox((0, 0), small, font=small_font)
    draw.text(((width - (title_bbox[2] - title_bbox[0])) / 2, 370), title, font=title_font, fill="#2b1748")
    draw.text(((width - (small_bbox[2] - small_bbox[0])) / 2, 416), small, font=small_font, fill="#5a4774")
    return card


def draw_centered(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, font_obj, fill, spacing=12):
    x0, y0, x1, _ = box
    lines = text.split("\n")
    heights = [draw.textbbox((0, 0), line, font=font_obj)[3] for line in lines]
    total_height = sum(heights) + spacing * (len(lines) - 1)
    y = y0
    for index, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font_obj)
        text_w = bbox[2] - bbox[0]
        draw.text((x0 + (x1 - x0 - text_w) / 2, y), line, font=font_obj, fill=fill)
        y += heights[index] + spacing
    return total_height


def build_preview():
    canvas_img = Image.new("RGBA", (TOTAL_W, TOTAL_H), "#0a0d27")
    front_source = print_boost(Image.open(FRONT_SOURCE).convert("RGB"))
    back_source = print_boost(Image.open(BACK_SOURCE).convert("RGB"))
    front = cover_crop(front_source, PANEL_W, PANEL_BOTTOM - PANEL_TOP, 0.56, 0.5)
    back = cover_crop(back_source, PANEL_W, PANEL_BOTTOM - PANEL_TOP, 0.5, 0.5)

    canvas_img.paste(back, (BACK_LEFT, PANEL_TOP))
    canvas_img.paste(front, (FRONT_LEFT, PANEL_TOP))

    draw = ImageDraw.Draw(canvas_img)
    add_vertical_gradient(canvas_img, (BACK_LEFT, PANEL_TOP, BACK_RIGHT, PANEL_BOTTOM), 0, 68)
    add_vertical_gradient(canvas_img, (FRONT_LEFT, PANEL_TOP, FRONT_RIGHT, PANEL_BOTTOM), 0, 76)

    # Keep the wrap area visually continuous so the art folds cleanly around the boards.
    left_wrap = cover_crop(back_source, WRAP, PANEL_BOTTOM - PANEL_TOP, 0.02, 0.5)
    right_wrap = cover_crop(front_source, WRAP, PANEL_BOTTOM - PANEL_TOP, 0.98, 0.5)
    canvas_img.paste(left_wrap, (0, PANEL_TOP))
    canvas_img.paste(right_wrap, (FRONT_RIGHT, PANEL_TOP))
    add_vertical_gradient(canvas_img, (0, PANEL_TOP, WRAP, PANEL_BOTTOM), 0, 82)
    add_vertical_gradient(canvas_img, (FRONT_RIGHT, PANEL_TOP, TOTAL_W, PANEL_BOTTOM), 0, 92)

    # Top/bottom wrap bands.
    draw.rectangle((0, 0, TOTAL_W, PANEL_TOP), fill="#0a0d27")
    draw.rectangle((0, PANEL_BOTTOM, TOTAL_W, TOTAL_H), fill="#0a0d27")

    # Spine.
    draw.rectangle((SPINE_LEFT, 0, SPINE_RIGHT, TOTAL_H), fill="#1b123f")
    spine_font = font(48, bold=True)
    spine_text = "LITTLE LEGENDS STORY"
    spine_layer = Image.new("RGBA", (TOTAL_H, SPINE_W), (0, 0, 0, 0))
    spine_draw = ImageDraw.Draw(spine_layer)
    bbox = spine_draw.textbbox((0, 0), spine_text, font=spine_font)
    spine_draw.text(
        ((TOTAL_H - (bbox[2] - bbox[0])) / 2, (SPINE_W - (bbox[3] - bbox[1])) / 2 - 8),
        spine_text,
        font=spine_font,
        fill="#fff2c8",
    )
    spine_layer = spine_layer.rotate(90, expand=True)
    canvas_img.alpha_composite(spine_layer, (SPINE_LEFT, round((TOTAL_H - spine_layer.height) / 2)))

    # Front panel: keep typography light and let the artwork carry the page.
    logo = logo_heart()
    canvas_img.alpha_composite(logo, (FRONT_LEFT + 220, PANEL_TOP + 155))
    draw.text((FRONT_LEFT + 350, PANEL_TOP + 188), "Little Legends Story", font=font(88, bold=True), fill="#fff8ea")
    draw.text((FRONT_LEFT + 354, PANEL_TOP + 300), "Personalised magical storybooks", font=font(48), fill="#ffe7a5")

    pill_w = 1460
    pill_h = 260
    pill_x = FRONT_LEFT + round((PANEL_W - pill_w) / 2)
    pill_y = PANEL_BOTTOM - 520
    glow = Image.new("RGBA", canvas_img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.rounded_rectangle(
        (pill_x - 16, pill_y - 16, pill_x + pill_w + 16, pill_y + pill_h + 16),
        radius=pill_h // 2,
        fill=(251, 191, 36, 95),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(34))
    canvas_img.alpha_composite(glow)
    canvas_img.alpha_composite(gradient_pill((pill_w, pill_h)), (pill_x, pill_y))
    draw_centered(
        draw,
        (pill_x, pill_y + 62, pill_x + pill_w, pill_y + 62),
        "Your child. The hero.",
        font(92, bold=True),
        "#35165f",
    )

    # Back panel: no heavy card, just readable copy over the open sky.
    copy_top = PANEL_TOP + 180
    copy_left = BACK_LEFT + 240
    copy_right = BACK_RIGHT - 820
    draw_centered(
        draw,
        (copy_left, copy_top, copy_right, copy_top),
        "A story made just for them",
        font(76, bold=True),
        "#fff8ea",
    )
    back_copy = [
        "A personalised keepsake storybook",
        "where your child becomes the hero.",
        "",
        "Created for magical bedtime moments,",
        "beautiful memories, and adventures",
        "they will want to read again and again.",
    ]
    y = copy_top + 132
    body_font = font(54)
    for line in back_copy:
        if not line:
            y += 38
            continue
        draw_centered(
            draw,
            (copy_left + 40, y, copy_right - 40, y),
            line,
            body_font,
            "#fff8ea",
        )
        y += 74
    feature_y = PANEL_BOTTOM - 540
    feature_font = font(40, bold=True)
    feature_boxes = [
        ("Personalised hero", "#ffe8f7"),
        ("Magical adventure", "#fff3c8"),
        ("Keepsake gift", "#e7f8ff"),
    ]
    feature_gap = 26
    feature_w = 760
    feature_x = BACK_LEFT + round((PANEL_W - ((feature_w * 3) + (feature_gap * 2))) / 2)
    for label, colour in feature_boxes:
        draw.rounded_rectangle(
            (feature_x, feature_y, feature_x + feature_w, feature_y + 126),
            radius=26,
            fill=(*ImageColor.getrgb(colour), 235),
            outline="#fff0c9",
            width=4,
        )
        bbox = draw.textbbox((0, 0), label, font=feature_font)
        draw.text(
            (
                feature_x + (feature_w - (bbox[2] - bbox[0])) / 2,
                feature_y + (126 - (bbox[3] - bbox[1])) / 2 - 8,
            ),
            label,
            font=feature_font,
            fill="#30184f",
        )
        feature_x += feature_w + feature_gap

    qr = qr_card((440, 480))
    canvas_img.alpha_composite(qr, (BACK_RIGHT - 610, PANEL_TOP + 130))

    draw_centered(
        draw,
        (BACK_LEFT + 200, PANEL_BOTTOM - 250, BACK_RIGHT - 200, PANEL_BOTTOM - 250),
        "littlelegendsstory.com",
        font(46, bold=True),
        "#ffe7a5",
    )

    canvas_img.convert("RGB").save(PREVIEW_PATH, quality=95)

    pdf = canvas.Canvas(str(PDF_PATH), pagesize=(TOTAL_W_IN * 72, TOTAL_H_IN * 72))
    pdf.drawImage(ImageReader(canvas_img.convert("RGB")), 0, 0, width=TOTAL_W_IN * 72, height=TOTAL_H_IN * 72)
    pdf.save()


if __name__ == "__main__":
    build_preview()
    print(PREVIEW_PATH)
    print(PDF_PATH)
