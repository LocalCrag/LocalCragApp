from enum import Enum


class ReleaseNoteItemTypeEnum(str, Enum):
    """Release note categories: new features first, fixes last."""

    FEATURE = "FEATURE"
    FIX = "FIX"


# Order used when listing items in a bundle (within a type, order is stable but arbitrary, e.g. by key).
RELEASE_NOTE_TYPE_DISPLAY_ORDER: tuple[ReleaseNoteItemTypeEnum, ...] = (
    ReleaseNoteItemTypeEnum.FEATURE,
    ReleaseNoteItemTypeEnum.FIX,
)


def release_note_type_display_rank(note_type: ReleaseNoteItemTypeEnum) -> int:
    return RELEASE_NOTE_TYPE_DISPLAY_ORDER.index(note_type)
