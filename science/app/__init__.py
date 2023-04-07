import os

from flask import Flask
from prisma import Prisma, register


def create_app(testing=False):
    # create and configure the app
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
    else:
        app.config["NODE_API_URL"] = "http://localhost:80"
    print("Using NODE_API_URL: {}".format(app.config["NODE_API_URL"]))

    return app
