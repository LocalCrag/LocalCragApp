from enum import Enum

from sqlalchemy import Enum as SaEnum


class PublicationStatusEnum(Enum):
    PUBLISHED = "published"
    DRAFT = "draft"
    REJECTED = "rejected"
    ARCHIVED = "archived"


publication_status_type = SaEnum(
    PublicationStatusEnum,
    name="publicationstatusenum",
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)
