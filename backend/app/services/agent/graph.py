from langgraph.graph import StateGraph, START, END
from app.services.agent.state import EvaluationState
from app.services.agent.nodes import (
    extract_and_chunk_node,
    retrieve_context_node,
    evaluate_criteria_node,
    synthesize_feedback_node,
    validate_and_normalize_node,
)


def build_evaluation_graph():
    builder = StateGraph(EvaluationState)

    builder.add_node("extract_and_chunk", extract_and_chunk_node)
    builder.add_node("retrieve_context", retrieve_context_node)
    builder.add_node("evaluate_criteria", evaluate_criteria_node)
    builder.add_node("synthesize_feedback", synthesize_feedback_node)
    builder.add_node("validate_and_normalize", validate_and_normalize_node)

    builder.add_edge(START, "extract_and_chunk")
    builder.add_edge("extract_and_chunk", "retrieve_context")
    builder.add_edge("retrieve_context", "evaluate_criteria")
    builder.add_edge("evaluate_criteria", "synthesize_feedback")
    builder.add_edge("synthesize_feedback", "validate_and_normalize")
    builder.add_edge("validate_and_normalize", END)

    return builder.compile()


evaluation_workflow = build_evaluation_graph()


def execute_evaluation(initial_state: EvaluationState) -> EvaluationState:
    result = evaluation_workflow.invoke(initial_state)
    return result
