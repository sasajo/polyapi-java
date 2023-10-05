import os
from flask import Flask, got_request_exception, request
from prisma import Prisma, register
import socket
import rollbar
import rollbar.contrib.flask


def report_exception(app, exception):
    rollbar.report_exc_info(request=request)
    # HACK recommended by rollbar support because otherwise
    # multi-process uwsgi does not log
    rollbar.wait()


def create_app(testing=False):
    # create and configure the app
    if not os.environ.get("DATABASE_URL"):
        raise NotImplementedError("DATABASE_URL missing from env variables")

    db = Prisma()
    db.connect()
    register(db)

    app = Flask(__name__, instance_relative_config=True)
    app.testing = testing
    from . import views
    app.register_blueprint(views.bp)

    # TODO handle config more pro
    if app.config["DEBUG"]:
        app.config["NODE_API_URL"] = "http://localhost:8000"
    elif app.testing:
        app.config["NODE_API_URL"] = "http://localhost:8000"
    else:
        print("DEBUG OFF")
        app.config["NODE_API_URL"] = "http://localhost:8000"

        if os.environ.get("ROLLBAR_TOKEN"):
            try:
                rollbar.init(os.environ.get("ROLLBAR_TOKEN"), socket.gethostname())
                got_request_exception.connect(report_exception, app)
            except:
                print("ROLLBAR FAILED TO INITIALIZE. MOVING ON!")

    return app
