import uuid

from werkzeug.datastructures import FileStorage
from models.file import File
from uploader.upload_handler_utils import store_tmp_file, post_upload, check_filesize_limit, get_max_file_size


def handle_file_upload(file: FileStorage) -> File:
    """
    Processes an uploaded file.
    :param args: Request arguments.
    :return: Created file model.
    """
    # Save file in tmp folder
    id = uuid.uuid4().hex
    temp_folder, temp_path, file = store_tmp_file(file, id)

    # Check filesize
    check_filesize_limit(file, get_max_file_size(), temp_folder)

    # Create file object
    file_entity = File()
    filename_parts = file.filename.split('.')
    extension = ''
    if len(filename_parts) > 1:
        extension = file.filename.split('.')[-1]
    file_entity.filename = '{}.{}'.format(id, extension)
    file_entity.original_filename = file.filename

    # Move file to uploads folder destination
    file.stream.seek(0)
    file.save('uploads/{}.{}'.format(id, extension))

    # Cleanup
    post_upload(file, temp_folder)
    return file_entity
