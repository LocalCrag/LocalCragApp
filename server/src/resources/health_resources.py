from flask import current_app, jsonify
from flask.views import MethodView
from sqlalchemy import text

from extensions import db
from uploader.do_spaces import get_spaces_client


class Health(MethodView):

    def get(self):
        """
        Health route to check if the server, database and spaces datastorage are healthy.
        """
        status = 200
        response = {"server": "healthy", "database": None, "spaces": None}

        # Test database connection
        try:
            db.session.execute(text("SELECT 1"))
            response["database"] = "healthy"
        except Exception:
            response["database"] = "Connection failed"
            status = 503

        # Test spaces connection
        try:
            spaces_client = get_spaces_client()
            spaces_client.head_bucket(Bucket=current_app.config["S3_BUCKET"])
            response["spaces"] = "healthy"
        except Exception:
            response["spaces"] = "Connection failed"
            status = 503

        return jsonify(response), status
