# Poly Data Science

This Python library contains the code for:

1. Hosting the Python Demo Server - the middleman between the client and OpenAI
2. Training new models on OpenAI

## Server

To start the server, run the following:

```
> cd science
> pip install -r requirements.txt
> prisma generate  # generates the library for python to access the db

// local dev default port of node server is 8000
// replace with your port if you customize
> NODE_API_URL=http://localhost:8000 ./server.py
< * Running on http://127.0.0.1:5000
```

Then to hit the server, request the following:

```
POST /function_completion/
{"question": "how do I get united flight information for a user?"}
```

The server will build a query based on your question, send it to OpenAI, and return the response.

NOTE: you must have an OPENAI_API_KEY in your environment. Contact Darko for a key if you don't have one yet!

## Tests

WARNING running the tests will modify your local db

TODO at some point separate the local test db and the test db

To run tests, run this:

```
cd science
prisma generate  # only needed before first test run
python -m unittest discover
```

All tests are in the `/tests` directory.

Follow the normal rules of naming for the [Python Unit testing framework](https://docs.python.org/3/library/unittest.html).


## Fine Tunes

Ok so you have a new hypothesis for how to create a hot new model?

How do you train it?

1. `cd poly-alpha/science`
2. Load training data into db
4. Run `./fine_tunes/fine_tune_generate_jsonl.py`
4. Run `./fine_tunes/fine_tune_start.py`
5. Wait for OpenAI to finish creating the new model:
`openai api fine_tunes.follow -i <fine_tune_id_printed_by_train_new_model.py>`