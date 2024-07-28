from flask.views import MethodView


class SentryTest(MethodView):

    def get(self):
        """
        Route to test sentry logging.
        """
        raise Exception("This is a test exception to test sentry logging.")
