from pypdf import PdfReader


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    pages_text = []
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            pages_text.append(f"[Page {page_num}]\n{text.strip()}")
    return "\n\n".join(pages_text)


def read_code_file(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def process_submission_file(file_path: str, file_type: str) -> str:
    ext = file_type.lower().lstrip(".")
    if ext == "pdf":
        return extract_text_from_pdf(file_path)
    return read_code_file(file_path)
