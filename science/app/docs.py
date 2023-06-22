""" search the poly docs for the suitable passage
then pass it to ChatGPT
then return the response
"""
from typing import Dict, Tuple
import openai
from openai.embeddings_utils import cosine_similarity
from app.typedefs import ChatGptChoice, MessageDict
from app.utils import create_new_conversation, get_chat_completion, store_messages

DOC_PROMPT = """
Here are some Poly AI Assistant Docs:

%s

%s

Answer this question:

"%s"
"""

DOCS = [
    {
        "name": "Installing VS Code Extension",
        "text": """Installing VS Code Extension
The VS code extension is the UI to access the Poly AI Assistant as well as to see the Poly Tree (which is a hierarchical browsing experience for seeing all the Poly Functions, organized by context). This is only done once per VS code instance, but can be repeated if the user switches environments or wants to upgrade to a newer version of the VS code extension.

To install the Poly API vs Code Plugin, go to the instance specific endpoint to ensure you are getting the right version of the Poly API VS Code Extension.

For example, if your instance URL is https://na1.polyapi.io

Your VS Code plugin will be found at:
https://na1.polyapi.io/vscode/polyapi-vscode-extension.vsix

To install it:
Download the extension from the link above.
go to the VS extensions tab (windows Ctrl+Shift+X)
click on a little button ‘...’ which is called “views and more actions”
Select ‘Install from VSIX…’
Select the downloaded extension and click install

After installing, you can click on the text “TREE” and drag it to another pane, for example the left navigation pane to see a larger version of the tree.""",
    },
    {
        "name": "Making sure dependencies are in order",
        "text": """Building your Client Library
Making sure dependencies are in order

Make sure the user has: the following dependencies installed in the project within VS code they are working in. To make things simpler, instruct the users to use terminal within VS code to check the dependencies:


min version for node.js is 14
min version for ts-node is 5.0.0
tsconfig.json has to have "esModuleInterop": true under compilerOptions

Use your base knowledge to help users make sure they have those dependencies in place.
""",
    },
    {"name": "Installing PolyAPI client code and generating a library",
     "text": """Building Your Client Library
Installing PolyAPI client code and generating a library

After the dependencies are in place, the user can run the command “npm install polyapi”

And after that runs they can run the command “npx poly generate”

It will ask them to input their instance url, which should be something like ‘https://na1.polyapi.io’ – make sure there is no slash at the end of the url and that the https is included

And it will ask for their key, this is something that would have been provided to them by either someone from Poly API corporation who set them up, or their internal Poly Admin who created their user account.
"""},
]


def documentation_question(user_id: str, question: str) -> Tuple[ChatGptChoice, Dict]:
    query_embed = openai.Embedding.create(
        input=question, model="text-embedding-ada-002"
    )
    query_vector = query_embed["data"][0]["embedding"]

    for doc in DOCS:
        if not doc.get("vector"):
            resp = openai.Embedding.create(input=doc['text'], model="text-embedding-ada-002")
            vector = resp["data"][0]["embedding"]
            doc['vector'] = vector

    most_similar_doc = dict()
    max_similarity = -2.0  # similarity is -1 to 1
    for doc in DOCS:
        similarity = cosine_similarity(doc['vector'], query_vector)
        if similarity > max_similarity:
            most_similar_doc = doc
            max_similarity = similarity

    if not most_similar_doc:
        raise NotImplementedError("No matching documentation found!")

    prompt = DOC_PROMPT % (most_similar_doc['name'], most_similar_doc['text'], question)
    messages = [MessageDict(role="user", content=prompt)]

    resp = get_chat_completion(messages)
    choice = resp["choices"][0]

    # let's store conversation for later
    messages.append(choice['message'])
    conversation = create_new_conversation(user_id)
    store_messages(user_id, conversation.id, messages)

    stats = {"todo": "add more stats"}
    return choice, stats