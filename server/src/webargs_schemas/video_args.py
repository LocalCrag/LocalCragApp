import uuid

import validators
from marshmallow import Schema, ValidationError, validate, validates_schema
from webargs import fields

from util.videos import MAX_START_SECONDS, provider_for_url


class VideosArgsSchema(Schema):
    """One line video: a provider link, or an uploaded file id."""

    url = fields.Str(required=False, allow_none=True)
    title = fields.Str(required=True, allow_none=False, validate=validate.Length(max=120))
    source = fields.Str(required=False, allow_none=True)
    fileId = fields.Str(required=False, allow_none=True)
    startSeconds = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(min=0, max=MAX_START_SECONDS),
    )

    @validates_schema
    def validate_video(self, data, **_kwargs):
        if data.get("fileId") or data.get("source") == "upload":
            file_id = data.get("fileId")
            try:
                uuid.UUID(str(file_id))
            except (TypeError, ValueError) as error:
                raise ValidationError("Uploaded video is missing its file.", "fileId") from error
            return
        url = (data.get("url") or "").strip()
        if not url or not validators.url(url):
            raise ValidationError(f"Invalid URL: {url}", "url")


class AscentVideoArgsSchema(VideosArgsSchema):
    """An ascent video is one YouTube, Vimeo, or Instagram link."""

    @validates_schema
    def validate_ascent_video(self, data, **_kwargs):
        if data.get("fileId") or data.get("source") == "upload":
            raise ValidationError("Ascent videos must be links, not uploaded files.", "url")
        url = (data.get("url") or "").strip()
        if provider_for_url(url) is None:
            raise ValidationError("Video URL must be a YouTube, Vimeo, or Instagram link.", "url")
