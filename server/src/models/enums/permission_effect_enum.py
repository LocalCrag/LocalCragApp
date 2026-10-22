from enum import Enum

from sqlalchemy import Enum as SaEnum


class PermissionEffectEnum(Enum):
    ALLOW = "allow"
    DENY = "deny"


permission_effect_type = SaEnum(
    PermissionEffectEnum,
    name="permissioneffectenum",
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)
