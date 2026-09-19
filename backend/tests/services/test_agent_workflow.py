from app.services.chunking import chunk_submission, chunk_text_content
from app.services.agent.tools.code_parser import parse_code_blocks


def test_code_parsing_and_chunking():
    sample_code = """def calculate_area(radius):
    \"\"\"Calculate circle area.\"\"\"
    import math
    return math.pi * radius * radius

class ShapeManager:
    def __init__(self):
        self.shapes = []

    def add_shape(self, shape):
        self.shapes.append(shape)
"""
    blocks = parse_code_blocks(sample_code, language="py")
    assert len(blocks) >= 2
    assert any("calculate_area" in b["name"] for b in blocks)
    assert any("ShapeManager" in b["name"] for b in blocks)

    chunks = chunk_submission(sample_code, "py")
    assert len(chunks) >= 2
    assert chunks[0]["type"] == "code"
    assert chunks[0]["start_line"] >= 1


def test_text_chunking():
    sample_text = (
        "Introduction paragraph to machine learning.\n\n"
        "Section 1: Supervised learning techniques including regressions.\n\n"
        "Section 2: Unsupervised clustering algorithms and dimensionality reduction."
    )
    chunks = chunk_text_content(sample_text, max_chunk_size=100)
    assert len(chunks) >= 2
    assert all(c["type"] == "text" for c in chunks)
