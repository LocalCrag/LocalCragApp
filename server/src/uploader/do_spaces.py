import boto3
import botocore
from flask import current_app


def get_spaces_client():
    session = boto3.session.Session()
    client = session.client('s3',
                            endpoint_url=current_app.config['SPACES_ENDPOINT'],
                            config=botocore.config.Config(s3={'addressing_style': 'virtual'}),
                            region_name=current_app.config['SPACES_REGION'],
                            aws_access_key_id=current_app.config['SPACES_ACCESS_KEY'],
                            aws_secret_access_key=current_app.config['SPACES_SECRET_KEY'])
    return client


def upload_file(client, bytes, filename):
    client.put_object(Bucket=current_app.config['SPACES_BUCKET'],
                      Key=filename,
                      Body=bytes,
                      ACL='public-read',
                      )
