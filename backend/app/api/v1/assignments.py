from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.api.deps import get_db, require_professor, get_current_user_optional
from app.models.user import User, UserRole
from app.models.submission import Submission
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentOut,
    AssignmentDetailOut,
    RubricCriterionOut,
    RubricCriterionCreate,
    RubricCriterionUpdate,
)
from app.services.assignment_service import (
    create_assignment_with_rubric,
    get_assignment_with_criteria,
    list_assignments_summary,
    remove_assignment,
    add_rubric_criterion,
    update_rubric_criterion,
    delete_rubric_criterion,
)
from app.repositories.assignment import assignment_repo

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentDetailOut)
def create(
    data: AssignmentCreate,
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    rubric_dicts = [r.model_dump() for r in data.rubric]
    assignment, criteria = create_assignment_with_rubric(
        session=session,
        title=data.title,
        description=data.description,
        allowed_types=data.allowed_types,
        max_file_size_mb=data.max_file_size_mb,
        due_date=data.due_date,
        creator_id=current_user.id,  # type: ignore
        rubric_list=rubric_dicts,
    )

    criteria_out = [
        RubricCriterionOut(
            id=c.id,  # type: ignore
            assignment_id=c.assignment_id,
            name=c.name,
            description=c.description,
            max_marks=c.max_marks,
            weight=c.weight,
            levels_json=c.levels_json,
        )
        for c in criteria
    ]

    return AssignmentDetailOut(
        id=assignment.id,  # type: ignore
        title=assignment.title,
        description=assignment.description,
        allowed_types=assignment.allowed_types,
        max_file_size_mb=assignment.max_file_size_mb,
        due_date=assignment.due_date,
        created_by=assignment.created_by,
        creator_username=current_user.username,
        created_at=assignment.created_at,
        criteria_count=len(criteria_out),
        submission_count=0,
        rubric=criteria_out,
    )


@router.get("", response_model=List[AssignmentOut])
def list_all(
    creator_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_db),
):
    # Professional RBAC scoping:
    # If a Professor calls this endpoint, automatically scope strictly to assignments created by them.
    # Administrators and students (or unauthenticated callers) view all assignments.
    effective_creator_id = creator_id
    if current_user and current_user.role == UserRole.PROFESSOR:
        effective_creator_id = current_user.id

    summaries = list_assignments_summary(session, creator_id=effective_creator_id)
    result = []
    for s in summaries:
        asgt = s["assignment"]
        student_sub_id = None
        student_sub_status = None
        if current_user and current_user.role == UserRole.STUDENT:
            student_sub = session.exec(
                select(Submission).where(
                    Submission.assignment_id == asgt.id,
                    Submission.student_id == current_user.id,
                )
            ).first()
            if student_sub:
                student_sub_id = student_sub.id
                student_sub_status = student_sub.status

        result.append(
            AssignmentOut(
                id=asgt.id,
                title=asgt.title,
                description=asgt.description,
                allowed_types=asgt.allowed_types,
                max_file_size_mb=asgt.max_file_size_mb,
                due_date=asgt.due_date,
                created_by=asgt.created_by,
                creator_username=s.get("creator_username"),
                created_at=asgt.created_at,
                criteria_count=s["criteria_count"],
                submission_count=s["submission_count"]
                if not current_user or current_user.role != UserRole.STUDENT
                else 0,
                student_submission_id=student_sub_id,
                student_submission_status=student_sub_status,
            )
        )
    return result


@router.get("/{assignment_id}", response_model=AssignmentDetailOut)
def get_one(assignment_id: int, session: Session = Depends(get_db)):
    assignment, criteria, sub_count, creator_username = get_assignment_with_criteria(
        session, assignment_id
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    criteria_out = [
        RubricCriterionOut(
            id=c.id,  # type: ignore
            assignment_id=c.assignment_id,
            name=c.name,
            description=c.description,
            max_marks=c.max_marks,
            weight=c.weight,
            levels_json=c.levels_json,
        )
        for c in criteria
    ]

    return AssignmentDetailOut(
        id=assignment.id,  # type: ignore
        title=assignment.title,
        description=assignment.description,
        allowed_types=assignment.allowed_types,
        max_file_size_mb=assignment.max_file_size_mb,
        due_date=assignment.due_date,
        created_by=assignment.created_by,
        creator_username=creator_username,
        created_at=assignment.created_at,
        criteria_count=len(criteria_out),
        submission_count=sub_count,
        rubric=criteria_out,
    )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    assignment_id: int,
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if current_user.role != UserRole.ADMIN and asgt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this assignment")

    success = remove_assignment(session, assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return None


@router.post("/{assignment_id}/rubric", response_model=RubricCriterionOut)
def add_criterion_route(
    assignment_id: int,
    data: RubricCriterionCreate,
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if current_user.role != UserRole.ADMIN and asgt.created_by != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this assignment's rubric"
        )

    try:
        crit = add_rubric_criterion(session, assignment_id, data.model_dump())
        return RubricCriterionOut(
            id=crit.id,  # type: ignore
            assignment_id=crit.assignment_id,
            name=crit.name,
            description=crit.description,
            max_marks=crit.max_marks,
            weight=crit.weight,
            levels_json=crit.levels_json,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{assignment_id}/rubric/{criterion_id}", response_model=RubricCriterionOut)
def update_criterion_route(
    assignment_id: int,
    criterion_id: int,
    data: RubricCriterionUpdate,
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if current_user.role != UserRole.ADMIN and asgt.created_by != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this assignment's rubric"
        )

    crit = assignment_repo.get_criterion(session, criterion_id)
    if not crit or crit.assignment_id != assignment_id:
        raise HTTPException(
            status_code=404, detail="Rubric criterion not found for this assignment"
        )

    updated = update_rubric_criterion(session, criterion_id, data.model_dump(exclude_unset=True))
    return RubricCriterionOut(
        id=updated.id,  # type: ignore
        assignment_id=updated.assignment_id,
        name=updated.name,
        description=updated.description,
        max_marks=updated.max_marks,
        weight=updated.weight,
        levels_json=updated.levels_json,
    )


@router.delete("/{assignment_id}/rubric/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_criterion_route(
    assignment_id: int,
    criterion_id: int,
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if current_user.role != UserRole.ADMIN and asgt.created_by != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this assignment's rubric"
        )

    crit = assignment_repo.get_criterion(session, criterion_id)
    if not crit or crit.assignment_id != assignment_id:
        raise HTTPException(
            status_code=404, detail="Rubric criterion not found for this assignment"
        )

    success = delete_rubric_criterion(session, criterion_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rubric criterion not found")
    return None
