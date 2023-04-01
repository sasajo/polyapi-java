import openai
from thefuzz import fuzz
from typing import Union
from utils import FunctionDto, WebhookDto, log

# how similar does a function or webhook have to be to be considered a match?
# scale is 0-100
# HACK was 60 just trying 40
NAME_SIMILARITY_THRESHOLD = 40
DESC_SIMILARITY_THRESHOLD = 40

# OLD_KEYWORD_PROMPT = """
# I will give you a prompt, respond to me with only a list of the relevant keywords from the prompt I give you.
# Assume that the keywords will be used to execute a search against a database of function records.

# Here is the prompt:

# {prompt}
# """

KEYWORD_PROMPT = """For the following prompt, give me back both the keywords from my prompt and semantically similar keywords.
This will be used to power an API discovery service.
Each keyword must be a single word.
Keep the list to the top 8 keywords relevant to APIs.
Don't include "API" "resource" as keywords.
Include all of the likely HTTP methods for this prompt, for example many times search is done using a POST.
List the set as a comma separated list. If the prompt is in a different language, translate and return the keywords in English.

{prompt}
"""


def extract_keywords(question: str) -> str:
    prompt = KEYWORD_PROMPT.format(prompt=question)
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
    )
    content = resp['choices'][0]['message']['content']
    return " ".join(content.split(", "))


def keywords_similar(keywords: str, func: Union[FunctionDto, WebhookDto], debug=False):
    if not keywords:
        # when we have no keywords, just assume everything matches for now
        return True

    keywords = keywords.lower()

    func_parts = []
    if func.get("context"):
        func_parts.append(func["context"])
    if func.get("name"):
        func_parts.append(func["name"])
    func_str = " ".join(func_parts).lower()
    name_ratio = fuzz.partial_ratio(keywords, func_str)
    if debug:
        log(keywords, name_ratio, func_str)

    desc_ratio = 0
    if func.get("description"):
        desc_ratio = fuzz.partial_ratio(keywords, func["description"])
        if debug:
            log(keywords, desc_ratio, func['description'])

    return (
        name_ratio > NAME_SIMILARITY_THRESHOLD or desc_ratio > DESC_SIMILARITY_THRESHOLD
    )