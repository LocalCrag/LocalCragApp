class InvalidFiletypeUploaded(Exception):
    """
    Raised when a file with an invalid type was uploaded.
    """
    pass


class FilesizeLimitExceeded(Exception):
    """
    Raised when a file with a too great size was uploaded.
    """

    def __init__(self, max_filesize):
        self.max_filesize = max_filesize
        super().__init__()
