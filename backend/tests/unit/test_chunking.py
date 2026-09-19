from app.services.chunking import chunk_submission, chunk_text_content
from app.services.agent.tools.code_parser import parse_code_blocks


def test_python_ast_parsing_and_chunking():
    """FR-11, FR-12: Semantic AST chunking for Python source code"""
    code = """# Binary Search Tree
class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

class BST:
    def __init__(self):
        self.root = None

    def insert(self, val):
        if not self.root:
            self.root = Node(val)
        else:
            self._insert(self.root, val)

    def _insert(self, curr, val):
        if val < curr.val:
            if curr.left is None:
                curr.left = Node(val)
            else:
                self._insert(curr.left, val)
        else:
            if curr.right is None:
                curr.right = Node(val)
            else:
                self._insert(curr.right, val)
"""
    blocks = parse_code_blocks(code, language="py")
    assert len(blocks) >= 2
    block_names = [b["name"] for b in blocks]
    assert any("Node" in name for name in block_names)
    assert any("BST" in name for name in block_names)

    chunks = chunk_submission(code, "py")
    assert len(chunks) >= 2
    for c in chunks:
        assert c["type"] == "code"
        assert c["start_line"] >= 1
        assert c["end_line"] >= c["start_line"]
        assert len(c["content"]) > 0


def test_text_paragraph_chunking():
    """FR-11, FR-12: Meaningful semantic chunking for text/report submissions"""
    report_text = (
        "Project Abstract: Automated grading and academic integrity verification using vector retrieval.\n\n"
        "Methodology: We implement a 5-stage agentic workflow leveraging LangGraph and ChromaDB vector search.\n\n"
        "Evaluation & Results: Score agreement achieved MAE of 0.45, with 100% rubric criteria coverage."
    )
    chunks = chunk_text_content(report_text, max_chunk_size=150)
    assert len(chunks) >= 2
    for idx, c in enumerate(chunks, start=1):
        assert c["type"] == "text"
        assert c["chunk_id"] == idx
        assert c["start_line"] >= 1
        assert c["end_line"] >= c["start_line"]


def test_chunking_fallback_for_plain_text():
    """NFR-21: Extensibility to various formats with graceful text chunking"""
    content = "Line 1\nLine 2\n\nParagraph 2 line 1\nParagraph 2 line 2"
    chunks = chunk_submission(content, "txt")
    assert len(chunks) >= 1
    assert chunks[0]["type"] == "text"


def test_chunking_empty_or_whitespace_input():
    """NFR-04: Graceful handling of empty or blank submissions"""
    chunks = chunk_submission("", "py")
    assert chunks == []

    chunks_text = chunk_text_content("   \n\n   ")
    assert chunks_text == []
