from flask import current_app, jsonify
from flask.views import MethodView
from sqlalchemy import text

from extensions import db
from uploader.do_s3 import get_s3_client


class Health(MethodView):

    def get(self):
        """
        Health route to check if the server, database and s3 datastorage are healthy.
        """
        status = 200
        response = {"server": "healthy", "database": None, "s3": None}

        # Test database connection
        try:
            db.session.execute(text("SELECT 1"))
            response["database"] = "healthy"
        except Exception:
            response["database"] = "Connection failed"
            status = 503

        # Test s3 connection
        try:
            s3_client = get_s3_client()
            s3_client.head_bucket(Bucket=current_app.config["S3_BUCKET"])
            response["s3"] = "healthy"
        except Exception:
            response["s3"] = "Connection failed"
            status = 503

        return jsonify(response), status
