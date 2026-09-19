import os
import tempfile
from app.services.doc_processor import read_code_file, process_submission_file


def test_read_code_file():
    """FR-11: Usable text extraction from source code files"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write("def hello():\n    print('Hello world!')\n")
        f_path = f.name

    try:
        content = read_code_file(f_path)
        assert "def hello():" in content
        assert "print('Hello world!')" in content
    finally:
        if os.path.exists(f_path):
            os.remove(f_path)


def test_process_submission_file_routing():
    """FR-11, NFR-21: Process submission router directs file types properly"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".java", delete=False, encoding="utf-8") as f:
        f.write("public class Main { public static void main(String[] args) {} }")
        f_path = f.name

    try:
        content = process_submission_file(f_path, "java")
        assert "public class Main" in content
    finally:
        if os.path.exists(f_path):
            os.remove(f_path)
