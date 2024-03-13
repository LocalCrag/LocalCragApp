from flask import jsonify
from flask.views import MethodView


class Health(MethodView):

    def get(self):
        """
        Health route to check if the server responds correctly to requests.
        """
        return jsonify(True), 200
