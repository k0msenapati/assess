from typing import List, Dict, Any
from pypdf import PdfReader


def extract_pdf_pages(file_path: str) -> List[Dict[str, Any]]:
    reader = PdfReader(file_path)
    pages = []
    for idx, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append({"page": idx, "text": text.strip()})
    return pages
