from typing import List, Dict, Any
from app.services.agent.tools.code_parser import parse_code_blocks


def chunk_text_content(
    text: str, max_chunk_size: int = 800, overlap: int = 100
) -> List[Dict[str, Any]]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[Dict[str, Any]] = []
    current_chunk = ""
    start_pos = 1

    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chunk_size:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(
                    {
                        "chunk_id": len(chunks) + 1,
                        "type": "text",
                        "title": f"Section {len(chunks) + 1}",
                        "start_line": start_pos,
                        "end_line": start_pos + current_chunk.count("\n"),
                        "content": current_chunk,
                    }
                )
                start_pos += current_chunk.count("\n") + 1
            current_chunk = para

    if current_chunk:
        chunks.append(
            {
                "chunk_id": len(chunks) + 1,
                "type": "text",
                "title": f"Section {len(chunks) + 1}",
                "start_line": start_pos,
                "end_line": start_pos + current_chunk.count("\n"),
                "content": current_chunk,
            }
        )

    return chunks


def chunk_submission(content: str, file_type: str) -> List[Dict[str, Any]]:
    ext = file_type.lower().lstrip(".")
    if ext in ["py", "java", "cpp", "c", "js", "ts", "sql", "html", "css"]:
        raw_blocks = parse_code_blocks(content, language=ext)
        return [
            {
                "chunk_id": idx,
                "type": "code",
                "title": b["name"],
                "start_line": b["start_line"],
                "end_line": b["end_line"],
                "content": b["content"],
            }
            for idx, b in enumerate(raw_blocks, start=1)
        ]
    return chunk_text_content(content)
