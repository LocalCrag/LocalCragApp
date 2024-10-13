from flask import current_app


def get_bucket_placeholders():
    bucket_placeholder = '{{BUCKET_PLACEHOLDER}}'
    if current_app.config['SPACES_ACCESS_ENDPOINT'] and current_app.config['SPACES_BUCKET']:
        if current_app.config['SPACES_ADDRESSING'] == 'path':
            bucket_placeholder_target = current_app.config['SPACES_ACCESS_ENDPOINT'].rstrip(
                "/") + f"/{current_app.config['SPACES_BUCKET']}"
        else:  # SPACES_ADDRESSING = 'virtual'
            bucket_placeholder_target = current_app.config['SPACES_ACCESS_ENDPOINT'].replace('://', '://{}.'.format(
                current_app.config['SPACES_BUCKET']))
    else:
        bucket_placeholder_target = '{{BUCKET_PLACEHOLDER}}'  # Path only used in tests
    return bucket_placeholder, bucket_placeholder_target


def add_bucket_placeholders(text):
    bucket_placeholder, bucket_placeholder_target = get_bucket_placeholders()
    if text:
        return text.replace(bucket_placeholder_target, bucket_placeholder)
    else:
        return text


def replace_bucket_placeholders(text):
    bucket_placeholder, bucket_placeholder_target = get_bucket_placeholders()
    if text:
        return text.replace(bucket_placeholder, bucket_placeholder_target)
    else:
        return text
