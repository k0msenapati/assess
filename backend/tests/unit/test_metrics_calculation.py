import pytest
from sqlmodel import SQLModel, create_engine, Session
from app.services.metrics_service import compute_evaluation_metrics
from app.models.evaluation import Evaluation, CriterionScore


@pytest.fixture
def unit_session():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_compute_evaluation_metrics_empty_db(unit_session: Session):
    """AI-08: Baseline evaluation-quality metrics on empty DB"""
    metrics = compute_evaluation_metrics(unit_session)
    assert metrics["total_evaluations"] == 0
    assert metrics["rubric_coverage_pct"] == 0.0
    assert metrics["score_agreement_mae"] == 0.0
    assert "retrieval_quality_avg_similarity" in metrics
    assert "feedback_quality_evidence_pct" in metrics
    assert "prompt_stability_avg_confidence" in metrics
    assert "average_processing_duration_seconds" in metrics


def test_compute_evaluation_metrics_with_data(unit_session: Session):
    """AI-08, NFR-22: Evaluation-quality experiment metrics covering MAE and coverage"""
    ev = Evaluation(
        submission_id=9999,
        status="finalized",
        total_score=18.0,
        total_max_score=20.0,
        processing_duration_seconds=1.8,
    )
    unit_session.add(ev)
    unit_session.commit()
    unit_session.refresh(ev)

    s1 = CriterionScore(
        evaluation_id=ev.id,  # type: ignore
        criterion_id=1,
        tentative_score=9.0,
        final_score=9.5,
        feedback="Great job",
        evidence_quotes_json='["line 5"]',
        confidence=0.92,
        is_overridden=True,
    )
    s2 = CriterionScore(
        evaluation_id=ev.id,  # type: ignore
        criterion_id=2,
        tentative_score=8.5,
        final_score=8.5,
        feedback="Clean code",
        evidence_quotes_json='["line 20"]',
        confidence=0.88,
        is_overridden=False,
    )
    unit_session.add(s1)
    unit_session.add(s2)
    unit_session.commit()

    metrics = compute_evaluation_metrics(unit_session)
    assert metrics["total_evaluations"] >= 1
    assert metrics["rubric_coverage_pct"] == 100.0
    assert metrics["score_agreement_mae"] == 0.25  # (|9.0-9.5| + |8.5-8.5|)/2 = 0.5/2 = 0.25
    assert metrics["overridden_criterion_count"] >= 1
    assert metrics["feedback_quality_evidence_pct"] == 100.0
    assert metrics["average_processing_duration_seconds"] > 0
