import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session
from app.config import settings
from app.api.deps import get_db, get_current_user, require_student
from app.models.user import User, UserRole
from app.schemas.submission import SubmissionOut, SubmissionContentOut
from app.services.submission_service import (
    create_submission,
    get_submission_detail,
    list_assignment_submissions,
    list_student_submissions,
    read_submission_raw_content,
)
from app.repositories.submission import submission_repo
from app.repositories.assignment import assignment_repo

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionOut)
def upload_submission(
    assignment_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_student),
    session: Session = Depends(get_db),
):
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise HTTPException(status_code=404, detail="Assignment not found")

    filename = file.filename or "submission.txt"
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    allowed_list = [x.strip().lower() for x in asgt.allowed_types.split(",")]

    if ext not in allowed_list:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '.{ext}' is not allowed. Allowed types: {asgt.allowed_types}",
        )

    # Save file to uploads directory
    saved_filename = f"asgt_{assignment_id}_user_{current_user.id}_{filename}"
    saved_filepath = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(saved_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_filepath)
    max_bytes = asgt.max_file_size_mb * 1024 * 1024
    if file_size > max_bytes:
        os.remove(saved_filepath)
        raise HTTPException(
            status_code=400,
            detail=f"File size ({file_size / (1024 * 1024):.1f}MB) exceeds limit of {asgt.max_file_size_mb}MB",
        )

    sub = create_submission(
        session=session,
        assignment_id=assignment_id,
        student_id=current_user.id,  # type: ignore
        file_name=filename,
        file_path=saved_filepath,
        file_type=ext,
        file_size_bytes=file_size,
    )

    detail = get_submission_detail(session, sub.id)  # type: ignore
    return SubmissionOut(
        id=sub.id,  # type: ignore
        assignment_id=sub.assignment_id,
        student_id=sub.student_id,
        student_username=detail["student_username"] if detail else current_user.username,
        assignment_title=detail["assignment_title"] if detail else asgt.title,
        file_name=sub.file_name,
        file_type=sub.file_type,
        file_size_bytes=sub.file_size_bytes,
        submitted_at=sub.submitted_at,
        status=sub.status,
    )


@router.get("/assignment/{assignment_id}", response_model=List[SubmissionOut])
def get_by_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    asgt = assignment_repo.get(session, assignment_id)
    if not asgt:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if current_user.role != UserRole.ADMIN and (
        current_user.role != UserRole.PROFESSOR or asgt.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view submissions for this assignment",
        )

    subs_data = list_assignment_submissions(session, assignment_id)
    return [
        SubmissionOut(
            id=d["submission"].id,
            assignment_id=d["submission"].assignment_id,
            student_id=d["submission"].student_id,
            student_username=d["student_username"],
            assignment_title=d["assignment_title"],
            file_name=d["submission"].file_name,
            file_type=d["submission"].file_type,
            file_size_bytes=d["submission"].file_size_bytes,
            submitted_at=d["submission"].submitted_at,
            status=d["submission"].status,
            evaluation_id=d.get("evaluation_id"),
            total_score=d.get("total_score"),
            total_max_score=d.get("total_max_score"),
        )
        for d in subs_data
    ]


@router.get("/my", response_model=List[SubmissionOut])
def get_my_submissions(
    current_user: User = Depends(get_current_user), session: Session = Depends(get_db)
):
    subs_data = list_student_submissions(session, current_user.id)  # type: ignore
    return [
        SubmissionOut(
            id=d["submission"].id,
            assignment_id=d["submission"].assignment_id,
            student_id=d["submission"].student_id,
            student_username=d["student_username"],
            assignment_title=d["assignment_title"],
            file_name=d["submission"].file_name,
            file_type=d["submission"].file_type,
            file_size_bytes=d["submission"].file_size_bytes,
            submitted_at=d["submission"].submitted_at,
            status=d["submission"].status,
            evaluation_id=d.get("evaluation_id"),
            total_score=d.get("total_score"),
            total_max_score=d.get("total_max_score"),
        )
        for d in subs_data
    ]


@router.get("/{submission_id}/content", response_model=SubmissionContentOut)
def get_content(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    sub = submission_repo.get(session, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    asgt = assignment_repo.get(session, sub.assignment_id)
    if current_user.role == UserRole.STUDENT and sub.student_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view another student's submission content",
        )
    if (
        current_user.role == UserRole.PROFESSOR
        and asgt
        and asgt.created_by != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to view this submission content"
        )

    content = read_submission_raw_content(sub)
    return SubmissionContentOut(
        id=sub.id,  # type: ignore
        file_name=sub.file_name,
        file_type=sub.file_type,
        content=content,
    )
