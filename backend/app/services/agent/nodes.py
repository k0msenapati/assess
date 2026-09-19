from typing import Dict, Any, List
from app.services.agent.state import EvaluationState
from app.services.doc_processor import process_submission_file
from app.services.chunking import chunk_submission
from app.services.vector_store import index_submission_chunks, retrieve_relevant_chunks
from app.services.llm_client import (
    evaluate_criterion_with_groq,
    synthesize_holistic_feedback,
)


def extract_and_chunk_node(state: EvaluationState) -> Dict[str, Any]:
    file_path = state["file_path"]
    file_type = state["file_type"]
    submission_id = state["submission_id"]

    try:
        extracted_text = process_submission_file(file_path, file_type)
        chunks = chunk_submission(extracted_text, file_type)
        index_submission_chunks(submission_id, chunks)

        return {
            "current_stage": "extract_and_chunk",
            "extracted_text": extracted_text,
            "chunks": chunks,
            "errors": state.get("errors", []),
        }
    except Exception as e:
        errors = list(state.get("errors", []))
        errors.append(f"extract_and_chunk failed: {str(e)}")
        return {
            "current_stage": "extract_and_chunk",
            "status": "failed",
            "errors": errors,
        }


def retrieve_context_node(state: EvaluationState) -> Dict[str, Any]:
    if state.get("status") == "failed":
        return {"current_stage": "retrieve_context"}

    submission_id = state["submission_id"]
    criteria = state.get("criteria", [])
    retrieved_contexts: Dict[int, List[Dict[str, Any]]] = {}

    try:
        for c in criteria:
            criterion_id = c["id"]
            query_text = f"{c['name']}: {c['description']}"
            chunks = retrieve_relevant_chunks(submission_id, query_text, top_k=3)
            retrieved_contexts[criterion_id] = chunks

        return {
            "current_stage": "retrieve_context",
            "retrieved_contexts": retrieved_contexts,
        }
    except Exception as e:
        errors = list(state.get("errors", []))
        errors.append(f"retrieve_context failed: {str(e)}")
        return {
            "current_stage": "retrieve_context",
            "status": "failed",
            "errors": errors,
        }


def evaluate_criteria_node(state: EvaluationState) -> Dict[str, Any]:
    if state.get("status") == "failed":
        return {"current_stage": "evaluate_criteria"}

    criteria = state.get("criteria", [])
    retrieved_contexts = state.get("retrieved_contexts", {})
    file_type = state.get("file_type", "txt")
    evaluations: List[Dict[str, Any]] = []

    try:
        for c in criteria:
            criterion_id = c["id"]
            chunks = retrieved_contexts.get(criterion_id, [])
            eval_result = evaluate_criterion_with_groq(c, chunks, file_type)
            evaluations.append(
                {
                    "criterion_id": criterion_id,
                    "name": c["name"],
                    "description": c["description"],
                    "max_marks": c["max_marks"],
                    "score": eval_result["score"],
                    "feedback": eval_result["feedback"],
                    "evidence_quotes": eval_result["evidence_quotes"],
                    "deductions": eval_result["deductions"],
                    "confidence": eval_result["confidence"],
                }
            )

        return {
            "current_stage": "evaluate_criteria",
            "criterion_evaluations": evaluations,
        }
    except Exception as e:
        errors = list(state.get("errors", []))
        errors.append(f"evaluate_criteria failed: {str(e)}")
        return {
            "current_stage": "evaluate_criteria",
            "status": "failed",
            "errors": errors,
        }


def synthesize_feedback_node(state: EvaluationState) -> Dict[str, Any]:
    if state.get("status") == "failed":
        return {"current_stage": "synthesize_feedback"}

    evaluations = state.get("criterion_evaluations", [])
    total_score = sum(e["score"] for e in evaluations)
    total_max = sum(e["max_marks"] for e in evaluations)

    try:
        holistic = synthesize_holistic_feedback(evaluations, total_score, total_max)
        return {
            "current_stage": "synthesize_feedback",
            "summary_feedback": holistic["summary"],
            "strengths": holistic["strengths"],
            "improvements": holistic["improvements"],
            "total_score": round(total_score, 2),
            "total_max_score": round(total_max, 2),
        }
    except Exception as e:
        errors = list(state.get("errors", []))
        errors.append(f"synthesize_feedback failed: {str(e)}")
        return {
            "current_stage": "synthesize_feedback",
            "status": "failed",
            "errors": errors,
        }


def validate_and_normalize_node(state: EvaluationState) -> Dict[str, Any]:
    if state.get("status") == "failed":
        return {"current_stage": "validate_and_normalize"}

    evaluations = state.get("criterion_evaluations", [])
    validated = []
    for e in evaluations:
        max_m = float(e["max_marks"])
        score = max(0.0, min(float(e["score"]), max_m))
        validated.append({**e, "score": round(score, 2)})

    total_score = round(sum(e["score"] for e in validated), 2)
    total_max = round(sum(e["max_marks"] for e in validated), 2)

    return {
        "current_stage": "validate_and_normalize",
        "criterion_evaluations": validated,
        "total_score": total_score,
        "total_max_score": total_max,
        "status": "tentative",
    }
