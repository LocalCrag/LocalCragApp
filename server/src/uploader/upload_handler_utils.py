import io
import os
import pathlib
import shutil
from typing import Tuple

from flask import current_app
from werkzeug.datastructures import FileStorage

from uploader.errors import FilesizeLimitExceeded


def get_max_file_size():
    """
    Returns the max allowed filesize. If the server's total body limit is too small, this value is used instead.
    @return:
    """
    if current_app.config['CLIENT_MAX_BODY_SIZE'] < current_app.config['MAX_FILE_SIZE']:
        return current_app.config['CLIENT_MAX_BODY_SIZE'] * 1024 * 1024
    return current_app.config['MAX_FILE_SIZE'] * 1024 * 1024


def get_max_image_size():
    """
    Returns the max allowed image filesize. If the server's total body limit is too small, this value is used instead.
    @return:
    """
    if current_app.config['CLIENT_MAX_BODY_SIZE'] < current_app.config['MAX_IMAGE_SIZE']:
        return current_app.config['CLIENT_MAX_BODY_SIZE'] * 1024 * 1024
    return current_app.config['MAX_IMAGE_SIZE'] * 1024 * 1024


def check_filesize_limit(file, max_filesize, temp_folder):
    """
    Checks the files filesize.
    """
    file.seek(0, os.SEEK_END)
    size = file.tell()
    if size > max_filesize:
        post_upload(file, temp_folder)
        raise FilesizeLimitExceeded(max_filesize)


def store_tmp_file(file: FileStorage, id: str) -> Tuple[str, str, any]:
    """
    Stores the file in the temporary folder.
    """
    temp_folder = os.path.join('uploads/tmp', id)
    pathlib.Path(temp_folder).mkdir(parents=True, exist_ok=True)
    temp_path = os.path.join(temp_folder, file.filename)
    file.save(temp_path)
    return temp_folder, temp_path, file


def post_upload(file, temp_folder):
    """
    Closes the file and removes the temporary folder.
    """
    file.close()
    remove_temp_folder(temp_folder)


def remove_temp_folder(temp_folder):
    """
    Cleans the temporary folder after the file upload and processing finished.
    :param temp_folder: The temp folder's path.
    """
    if os.path.isdir(temp_folder):
        shutil.rmtree(temp_folder)


def get_image_bytes(img):
    in_mem_file = io.BytesIO()
    img.save(in_mem_file, format=img.format)
    in_mem_file.seek(0)
    return in_mem_file
