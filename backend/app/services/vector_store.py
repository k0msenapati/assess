from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

chroma_client = chromadb.PersistentClient(
    path=settings.CHROMA_PERSIST_DIR,
    settings=ChromaSettings(anonymized_telemetry=False),
)


def get_submission_collection(submission_id: int):
    collection_name = f"submission_{submission_id}"
    return chroma_client.get_or_create_collection(
        name=collection_name, metadata={"hnsw:space": "cosine"}
    )


def index_submission_chunks(submission_id: int, chunks: List[Dict[str, Any]]) -> None:
    collection = get_submission_collection(submission_id)
    # Clear existing documents if re-evaluating
    existing = collection.get()
    if existing and existing.get("ids"):
        collection.delete(ids=existing["ids"])

    if not chunks:
        return

    ids = [f"chunk_{c['chunk_id']}" for c in chunks]
    documents = [c["content"] for c in chunks]
    metadatas = [
        {
            "chunk_id": c["chunk_id"],
            "title": c.get("title", ""),
            "start_line": c.get("start_line", 1),
            "end_line": c.get("end_line", 1),
            "type": c.get("type", "text"),
        }
        for c in chunks
    ]
    collection.add(ids=ids, documents=documents, metadatas=metadatas)


def retrieve_relevant_chunks(
    submission_id: int, query_text: str, top_k: int = 3
) -> List[Dict[str, Any]]:
    collection = get_submission_collection(submission_id)
    count = collection.count()
    if count == 0:
        return []

    limit = min(top_k, count)
    results = collection.query(
        query_texts=[query_text],
        n_results=limit,
        include=["documents", "metadatas", "distances"],
    )

    retrieved = []
    if results and results.get("documents") and results["documents"][0]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
        distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
        for doc, meta, dist in zip(docs, metas, distances):
            retrieved.append(
                {
                    "content": doc,
                    "title": meta.get("title", ""),
                    "start_line": meta.get("start_line", 1),
                    "end_line": meta.get("end_line", 1),
                    "distance": dist,
                    "similarity": max(0.0, 1.0 - dist),
                }
            )
    return retrieved


def get_rubric_collection(assignment_id: int):
    collection_name = f"rubric_{assignment_id}"
    return chroma_client.get_or_create_collection(
        name=collection_name, metadata={"hnsw:space": "cosine"}
    )


def index_rubric_criteria(assignment_id: int, criteria: List[Any]) -> None:
    collection = get_rubric_collection(assignment_id)
    existing = collection.get()
    if existing and existing.get("ids"):
        collection.delete(ids=existing["ids"])

    if not criteria:
        return

    ids = []
    documents = []
    metadatas = []
    for c in criteria:
        cid = getattr(c, "id", None) if hasattr(c, "id") else c.get("id")
        name = getattr(c, "name", "") if hasattr(c, "name") else c.get("name", "")
        desc = (
            getattr(c, "description", "") if hasattr(c, "description") else c.get("description", "")
        )
        max_m = (
            getattr(c, "max_marks", 10.0) if hasattr(c, "max_marks") else c.get("max_marks", 10.0)
        )
        weight = getattr(c, "weight", 1.0) if hasattr(c, "weight") else c.get("weight", 1.0)

        ids.append(f"rubric_{cid}")
        doc = f"{name}: {desc}"
        documents.append(doc)
        metadatas.append(
            {
                "criterion_id": int(cid) if cid is not None else 0,
                "name": str(name),
                "max_marks": float(max_m),
                "weight": float(weight),
            }
        )

    collection.add(ids=ids, documents=documents, metadatas=metadatas)


def retrieve_rubric_criteria(
    assignment_id: int, query_text: str, top_k: int = 3
) -> List[Dict[str, Any]]:
    collection = get_rubric_collection(assignment_id)
    count = collection.count()
    if count == 0:
        return []

    limit = min(top_k, count)
    results = collection.query(
        query_texts=[query_text],
        n_results=limit,
        include=["documents", "metadatas", "distances"],
    )

    retrieved = []
    if results and results.get("documents") and results["documents"][0]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
        distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)
        for doc, meta, dist in zip(docs, metas, distances):
            retrieved.append(
                {
                    "criterion_id": meta.get("criterion_id"),
                    "name": meta.get("name", ""),
                    "document": doc,
                    "max_marks": meta.get("max_marks", 10.0),
                    "distance": dist,
                    "similarity": max(0.0, 1.0 - dist),
                }
            )
    return retrieved
