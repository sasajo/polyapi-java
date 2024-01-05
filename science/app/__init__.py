import os
import sys
import logging
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

    if app.config["DEBUG"]:
        app.config["NODE_API_URL"] = "http://localhost:8000"
        app.config["VAULT_ADDRESS"] = "http://127.0.0.1:8200"
        app.config["VAULT_TOKEN"] = "root"
    elif app.testing:
        app.config["NODE_API_URL"] = "http://localhost:8000"
    else:
        print("DEBUG OFF")
        app.config["NODE_API_URL"] = "http://localhost:8000"
        app.config["VAULT_ADDRESS"] = os.environ.get("VAULT_ADDRESS", "")
        app.config["VAULT_TOKEN"] = os.environ.get("VAULT_TOKEN", "")

        if os.environ.get("ROLLBAR_TOKEN"):
            try:
                rollbar.init(os.environ.get("ROLLBAR_TOKEN"), socket.gethostname())
                got_request_exception.connect(report_exception, app)
            except:
                print("ROLLBAR FAILED TO INITIALIZE. MOVING ON!")

    log_level = getattr(logging, os.environ.get("PYTHON_LOG_LEVEL", "INFO"))

    if log_level == logging.DEBUG and not app.config["DEBUG"]:
        print("Debug is off so DEBUG log level cannot be enabled. Setting log level to INFO.")
        log_level = logging.INFO

    app.logger.setLevel(log_level)
    werkzeug_log = logging.getLogger('werkzeug')

    # override werkzeug log level to be warning because that better aligns with our notion of info
    werkzeug_log.setLevel(logging.WARNING if log_level == logging.INFO else log_level)

    log_level_name = logging.getLevelName(log_level)
    print(f"Python Log Level set to {log_level_name}")

    log_line_format = "[%(levelname)s] %(message)s"
    logging.basicConfig(stream=sys.stdout, level=log_level, format=log_line_format)

    return app
