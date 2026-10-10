import base64
import hashlib

import boto3
import botocore
from flask import current_app


def _add_delete_objects_content_md5(params, **kwargs):
    """Put Content-MD5 back on DeleteObjects and skip the default CRC32 checksum.

    Since botocore 1.36, DeleteObjects sends ``x-amz-checksum-crc32`` and omits
    Content-MD5. S3-compatible stores (MinIO, some Spaces deployments) still
    reject that request with MissingContentMD5.
    """
    body = params.get("body")
    if isinstance(body, str):
        body = body.encode("utf-8")
    if not isinstance(body, (bytes, bytearray)):
        return

    headers = params["headers"]
    if "Content-MD5" not in headers:
        digest = hashlib.md5(body, usedforsecurity=False).digest()
        headers["Content-MD5"] = base64.b64encode(digest).decode("ascii")

    # apply_request_checksum runs after this handler. Dropping the resolved
    # algorithm keeps the CRC header off the signed request.
    checksum = params.get("context", {}).get("checksum")
    if isinstance(checksum, dict):
        checksum.pop("request_algorithm", None)
        checksum.pop("request_algorithm_header", None)


def get_s3_client():
    session = boto3.session.Session()
    client = session.client(
        "s3",
        endpoint_url=current_app.config["S3_ENDPOINT"],
        config=botocore.config.Config(s3={"addressing_style": current_app.config["S3_ADDRESSING"]}),
        region_name=current_app.config["S3_REGION"],
        aws_access_key_id=current_app.config["S3_USER"],
        aws_secret_access_key=current_app.config["S3_PASSWORD"],
    )
    client.meta.events.register("before-call.s3.DeleteObjects", _add_delete_objects_content_md5)
    return client


def upload_file(client, bytes, filename):
    client.put_object(
        Bucket=current_app.config["S3_BUCKET"],
        Key=filename,
        Body=bytes,
        ACL="public-read",
    )
