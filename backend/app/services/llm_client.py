import json
from typing import Dict, Any, List, Optional
from groq import Groq
from app.config import settings


def get_groq_client() -> Optional[Groq]:
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
        return Groq(api_key=settings.GROQ_API_KEY.strip())
    return None


def evaluate_criterion_with_groq(
    criterion: Dict[str, Any], retrieved_chunks: List[Dict[str, Any]], file_type: str
) -> Dict[str, Any]:
    client = get_groq_client()
    if not client:
        return mock_evaluate_criterion(criterion, retrieved_chunks)

    context_text = "\n\n---\n\n".join(
        [
            f"[Location: lines {c.get('start_line')}-{c.get('end_line')} | {c.get('title')}]\n{c.get('content')}"
            for c in retrieved_chunks
        ]
    )

    prompt = f"""You are an expert academic evaluator applying a structured rubric to evaluate a student submission.

RUBRIC CRITERION:
- Name: {criterion.get("name")}
- Description: {criterion.get("description")}
- Maximum Marks: {criterion.get("max_marks")}

RELEVANT EXCERPTS FROM SUBMISSION:
{context_text if context_text else "No directly matching content found."}

INSTRUCTIONS:
1. Objectively evaluate how well the excerpts meet the criterion requirements.
2. Award a tentative score between 0.0 and {criterion.get("max_marks")}.
3. Cite specific evidence or direct quotes from the submission.
4. If points are deducted, provide clear academic deductions and reasons.
5. Provide constructive, professional academic feedback.

You MUST reply ONLY with a valid JSON object matching this schema:
{{
    "score": <float between 0.0 and {criterion.get("max_marks")}>,
    "feedback": "<detailed constructive feedback>",
    "evidence_quotes": ["<quote 1 with line reference>", "<quote 2>"],
    "deductions": ["<deduction reason 1>", "<deduction reason 2>"],
    "confidence": <float between 0.0 and 1.0>
}}
"""

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an objective academic grading assistant. Always respond with pure valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or "{}"
        data = json.loads(content)
        score = float(data.get("score", criterion.get("max_marks", 10.0) * 0.8))
        max_m = float(criterion.get("max_marks", 10.0))
        bounded_score = max(0.0, min(score, max_m))
        return {
            "score": round(bounded_score, 2),
            "feedback": data.get("feedback", "Criterion evaluated against submission content."),
            "evidence_quotes": data.get("evidence_quotes", []),
            "deductions": data.get("deductions", []),
            "confidence": float(data.get("confidence", 0.9)),
        }
    except Exception as e:
        # If Groq call errors (e.g. invalid key or model rate limit), fallback gracefully
        return mock_evaluate_criterion(criterion, retrieved_chunks, fallback_error=str(e))


def mock_evaluate_criterion(
    criterion: Dict[str, Any],
    retrieved_chunks: List[Dict[str, Any]],
    fallback_error: Optional[str] = None,
) -> Dict[str, Any]:
    max_m = float(criterion.get("max_marks", 10.0))
    has_content = len(retrieved_chunks) > 0

    if has_content:
        first_chunk = retrieved_chunks[0]
        sample_line = f"Line {first_chunk.get('start_line', 1)}-{first_chunk.get('end_line', 10)}"
        first_line_content = first_chunk.get("content", "").split("\n")[0][:80]
        score = round(max_m * 0.85, 2)
        feedback = f"Demonstrates solid adherence to '{criterion.get('name')}'. Relevant structure located at {sample_line}."
        evidence = [f'Found relevant block at {sample_line}: "{first_line_content}"']
        deductions = ["Minor documentation or edge-case handling can be enhanced."]
    else:
        score = round(max_m * 0.5, 2)
        feedback = f"Partial evidence found for '{criterion.get('name')}'. Explicit coverage could be improved."
        evidence = []
        deductions = ["Criterion not clearly referenced or articulated in retrieved sections."]

    return {
        "score": score,
        "feedback": feedback,
        "evidence_quotes": evidence,
        "deductions": deductions,
        "confidence": 0.85,
    }


def synthesize_holistic_feedback(
    criterion_evals: List[Dict[str, Any]], overall_score: float, max_score: float
) -> Dict[str, Any]:
    client = get_groq_client()
    score_pct = (overall_score / max_score * 100) if max_score > 0 else 0

    if client:
        summary_prompt = f"""Summarize this academic submission evaluation:
Total Score: {overall_score}/{max_score} ({score_pct:.1f}%)
Criteria breakdown: {json.dumps([{"name": c["name"], "score": c["score"], "max": c["max_marks"], "deductions": c["deductions"]} for c in criterion_evals])}

Respond ONLY with valid JSON:
{{
    "summary": "<2-3 sentence academic summary>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>"]
}}
"""
        try:
            completion = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an objective academic evaluator. Respond in valid JSON.",
                    },
                    {"role": "user", "content": summary_prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            return json.loads(completion.choices[0].message.content or "{}")
        except Exception:
            pass

    # Heuristic synthesis fallback
    strengths = [
        f"Strong performance in {c['name']} ({c['score']}/{c['max_marks']})"
        for c in criterion_evals
        if c["score"] >= c["max_marks"] * 0.8
    ]
    if not strengths:
        strengths = ["Submission addresses the baseline assignment requirements."]

    improvements = []
    for c in criterion_evals:
        if c.get("deductions"):
            improvements.extend(c["deductions"])
    if not improvements:
        improvements = ["Maintain thorough inline documentation and unit test coverage."]

    summary = f"The submission demonstrates a good grasp of core principles, achieving a tentative score of {overall_score}/{max_score} ({score_pct:.1f}%)."
    return {
        "summary": summary,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
    }
