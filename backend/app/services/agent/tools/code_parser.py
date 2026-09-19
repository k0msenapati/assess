import re
from typing import List, Dict, Any

CODE_BLOCK_PATTERNS = [
    re.compile(r"^\s*(def |class |async def )\s*([a-zA-Z0-9_]+)"),
    re.compile(r"^\s*(function|const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(async\s*)?\("),
    re.compile(r"^\s*(public|private|protected|static|\s)+[\w<>\[\]]+\s+([a-zA-Z0-9_]+)\s*\("),
]


def parse_code_blocks(code_content: str, language: str = "py") -> List[Dict[str, Any]]:
    lines = code_content.splitlines()
    blocks = []
    current_block_name = "Global / Module"
    current_start = 1
    current_lines = []

    for line_num, line in enumerate(lines, start=1):
        matched_name = None
        for pattern in CODE_BLOCK_PATTERNS:
            match = pattern.match(line)
            if match:
                matched_name = match.group(0).strip()
                break

        if matched_name:
            if current_lines:
                blocks.append(
                    {
                        "name": current_block_name,
                        "start_line": current_start,
                        "end_line": line_num - 1,
                        "content": "\n".join(current_lines),
                        "language": language,
                    }
                )
                current_lines = [line]
                current_start = line_num
            else:
                current_lines.append(line)
            current_block_name = matched_name
        else:
            current_lines.append(line)

    if current_lines:
        blocks.append(
            {
                "name": current_block_name,
                "start_line": current_start,
                "end_line": len(lines),
                "content": "\n".join(current_lines),
                "language": language,
            }
        )

    return blocks
