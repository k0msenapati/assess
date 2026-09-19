from typing import Optional, Dict
from sqlmodel import Session, select
from app.models.system_config import SystemConfig
from app.repositories.base import BaseRepository


class SystemConfigRepository(BaseRepository[SystemConfig]):
    def __init__(self):
        super().__init__(SystemConfig)

    def get_by_key(self, session: Session, key: str) -> Optional[SystemConfig]:
        return session.exec(select(SystemConfig).where(SystemConfig.key == key)).first()

    def set_value(
        self, session: Session, key: str, value: str, description: Optional[str] = None
    ) -> SystemConfig:
        cfg = self.get_by_key(session, key)
        if cfg:
            cfg.value = value
            if description:
                cfg.description = description
            return self.update(session, cfg)
        else:
            new_cfg = SystemConfig(key=key, value=value, description=description)
            return self.create(session, new_cfg)

    def get_all_as_dict(self, session: Session) -> Dict[str, str]:
        configs = self.list(session)
        default_configs = {
            "max_file_size_mb": "15",
            "allowed_file_types": "pdf,py,java,cpp,c,js,ts,txt",
            "llm_model": "llama-3.3-70b-versatile",
            "llm_temperature": "0.2",
            "enable_semantic_chunking": "true",
            "rag_top_k": "3",
        }
        for c in configs:
            default_configs[c.key] = c.value
        return default_configs


system_config_repo = SystemConfigRepository()
