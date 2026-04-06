from pathlib import Path
import textwrap


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "study_planner_ai_report.md"
OUTPUT = ROOT / "study_planner_ai_report.pdf"

PAGE_WIDTH = 595
PAGE_HEIGHT = 842
LEFT = 54
TOP = 60
BOTTOM = 54
FONT_SIZE = 12
LINE_HEIGHT = 18
MAX_CHARS = 88


def escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def markdown_to_lines(text: str):
    lines = []
    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped:
          lines.append("")
          continue

        if stripped.startswith("# "):
            title = stripped[2:].strip().upper()
            lines.append(title)
            lines.append("")
            continue

        if stripped.startswith("## "):
            title = stripped[3:].strip()
            lines.append(title)
            lines.append("")
            continue

        if stripped.startswith("### "):
            title = stripped[4:].strip()
            lines.append(title)
            continue

        if stripped.startswith("- "):
            wrapped = textwrap.wrap(f"* {stripped[2:].strip()}", width=MAX_CHARS)
            lines.extend(wrapped or ["*"])
            continue

        if stripped[0].isdigit() and ". " in stripped[:4]:
            wrapped = textwrap.wrap(stripped, width=MAX_CHARS)
            lines.extend(wrapped or [stripped])
            continue

        cleaned = stripped.replace("**", "")
        wrapped = textwrap.wrap(cleaned, width=MAX_CHARS)
        lines.extend(wrapped or [cleaned])
    return lines


def paginate(lines):
    pages = []
    current = []
    y = PAGE_HEIGHT - TOP

    for line in lines:
        if y < BOTTOM:
            pages.append(current)
            current = []
            y = PAGE_HEIGHT - TOP
        current.append((LEFT, y, line))
        y -= LINE_HEIGHT

    if current:
        pages.append(current)
    return pages


def build_pdf(pages):
    objects = []

    def add_object(data: bytes):
        objects.append(data)
        return len(objects)

    font_id = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>")

    page_ids = []
    content_ids = []

    for page in pages:
        stream_lines = ["BT", f"/F1 {FONT_SIZE} Tf"]
        for x, y, text in page:
            safe = escape_pdf_text(text)
            stream_lines.append(f"1 0 0 1 {x} {y} Tm ({safe}) Tj")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("latin-1", errors="replace")
        content_id = add_object(
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream"
        )
        content_ids.append(content_id)
        page_ids.append(None)

    pages_root_id = add_object(b"")

    for index, content_id in enumerate(content_ids):
        page_obj = (
            f"<< /Type /Page /Parent {pages_root_id} 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        ).encode("latin-1")
        page_ids[index] = add_object(page_obj)

    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    objects[pages_root_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("latin-1")
    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_root_id} 0 R >>".encode("latin-1"))

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref_pos}\n%%EOF".encode(
            "latin-1"
        )
    )
    return pdf


def main():
    text = SOURCE.read_text(encoding="utf-8")
    lines = markdown_to_lines(text)
    pages = paginate(lines)
    pdf = build_pdf(pages)
    OUTPUT.write_bytes(pdf)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    main()
