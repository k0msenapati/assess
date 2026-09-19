from typing import Optional, List, Tuple, Dict, Any
from sqlmodel import Session, select
from app.models.user import User
from app.models.assignment import Assignment, RubricCriterion
from app.models.submission import Submission
from app.repositories.assignment import assignment_repo
from app.services.vector_store import index_rubric_criteria


def create_assignment_with_rubric(
    session: Session,
    title: str,
    description: str,
    allowed_types: str,
    max_file_size_mb: int,
    due_date: Optional[Any],
    creator_id: int,
    rubric_list: List[Dict[str, Any]],
) -> Tuple[Assignment, List[RubricCriterion]]:
    assignment = Assignment(
        title=title,
        description=description,
        allowed_types=allowed_types,
        max_file_size_mb=max_file_size_mb,
        due_date=due_date,
        created_by=creator_id,
    )
    assignment_repo.create(session, assignment)

    created_criteria: List[RubricCriterion] = []
    for r in rubric_list:
        crit = RubricCriterion(
            assignment_id=assignment.id,  # type: ignore
            name=r["name"],
            description=r["description"],
            max_marks=r["max_marks"],
            weight=r.get("weight", 1.0),
            levels_json=r.get("levels_json", "[]"),
        )
        assignment_repo.add_criterion(session, crit)
        created_criteria.append(crit)

    try:
        index_rubric_criteria(assignment.id, created_criteria)  # type: ignore
    except Exception:
        pass

    return assignment, created_criteria


def get_assignment_with_criteria(
    session: Session, assignment_id: int
) -> Tuple[Optional[Assignment], List[RubricCriterion], int, Optional[str]]:
    assignment = assignment_repo.get(session, assignment_id)
    if not assignment:
        return None, [], 0, None
    criteria = assignment_repo.get_criteria(session, assignment_id)
    sub_count = len(
        list(
            session.exec(select(Submission).where(Submission.assignment_id == assignment_id)).all()
        )
    )
    creator = session.get(User, assignment.created_by)
    creator_username = creator.username if creator else None
    return assignment, criteria, sub_count, creator_username


def list_assignments_summary(
    session: Session, creator_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    if creator_id is not None:
        assignments = list(
            session.exec(select(Assignment).where(Assignment.created_by == creator_id)).all()
        )
    else:
        assignments = assignment_repo.list(session)
    summaries = []
    for a in assignments:
        crit_count = len(assignment_repo.get_criteria(session, a.id))  # type: ignore
        sub_count = len(
            list(session.exec(select(Submission).where(Submission.assignment_id == a.id)).all())
        )
        creator = session.get(User, a.created_by)
        summaries.append(
            {
                "assignment": a,
                "creator_username": creator.username if creator else None,
                "criteria_count": crit_count,
                "submission_count": sub_count,
            }
        )
    return summaries


def remove_assignment(session: Session, assignment_id: int) -> bool:
    return assignment_repo.delete(session, assignment_id)


def add_rubric_criterion(
    session: Session, assignment_id: int, data: Dict[str, Any]
) -> RubricCriterion:
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise ValueError("Assignment not found")

    crit = RubricCriterion(
        assignment_id=assignment_id,
        name=data["name"],
        description=data["description"],
        max_marks=data["max_marks"],
        weight=data.get("weight", 1.0),
        levels_json=data.get("levels_json", "[]"),
    )
    assignment_repo.add_criterion(session, crit)
    all_crit = assignment_repo.get_criteria(session, assignment_id)
    try:
        index_rubric_criteria(assignment_id, all_crit)
    except Exception:
        pass
    return crit


def update_rubric_criterion(
    session: Session, criterion_id: int, data: Dict[str, Any]
) -> RubricCriterion:
    crit = assignment_repo.get_criterion(session, criterion_id)
    if not crit:
        raise ValueError("Rubric criterion not found")

    if "name" in data and data["name"] is not None:
        crit.name = data["name"]
    if "description" in data and data["description"] is not None:
        crit.description = data["description"]
    if "max_marks" in data and data["max_marks"] is not None:
        crit.max_marks = data["max_marks"]
    if "weight" in data and data["weight"] is not None:
        crit.weight = data["weight"]
    if "levels_json" in data and data["levels_json"] is not None:
        crit.levels_json = data["levels_json"]

    assignment_repo.update_criterion(session, crit)
    all_crit = assignment_repo.get_criteria(session, crit.assignment_id)
    try:
        index_rubric_criteria(crit.assignment_id, all_crit)
    except Exception:
        pass
    return crit


def delete_rubric_criterion(session: Session, criterion_id: int) -> bool:
    crit = assignment_repo.get_criterion(session, criterion_id)
    if not crit:
        return False
    asgt_id = crit.assignment_id
    success = assignment_repo.delete_criterion(session, criterion_id)
    if success:
        all_crit = assignment_repo.get_criteria(session, asgt_id)
        try:
            index_rubric_criteria(asgt_id, all_crit)
        except Exception:
            pass
    return success
