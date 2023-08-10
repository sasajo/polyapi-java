import json
from typing import Literal, Tuple
from app.completion import simple_chatgpt_question

ROUTER_PROMPT = """
Please categorize the user's question. Here are the categories:

```
{
    "function": "The user is looking for a function or details about a function to address their need",
    "documentation": "The user is looking to understand how to do something specific with PolyAPI or has a general question about PolyAPI",
    %s
}
```

Please return the category as JSON

For example, if the user asks "How do I get a list of products on shopify?"

You should return `{"category": "function"}` because the user is looking for a function to perform that action.

Here is the question:

"%s"
"""


def route_question_ai(question: str) -> Literal["function", "general", "documentation", "help"]:
    if "poly" in question.lower():
        general = ""
    else:
        general = '"general": "The user is asking a general programming or informational question"'

    prompt = ROUTER_PROMPT % (general, question)
    content = simple_chatgpt_question(prompt)
    data = json.loads(content)
    return data['category']  # type: ignore


def split_route_and_question(question: str) -> Tuple[Literal["function", "general", "documentation", "help"], str]:
    question = question.strip()
    if question.startswith("/"):
        parts = question.split(" ", 1)

        route_cmd = parts[0]
        if len(parts) == 1:
            question = ""
        else:
            question = parts[1].strip()

        route = get_route(route_cmd)
        return route, question
    else:
        return "function", question


ROUTE_CMD_MAP = {
    "f": "function",
    "function": "function",
    "poly": "documentation",
    "p": "documentation",
    "docs": "documentation",
    "d": "documentation",
    "help": "help",
    "h": "help",
    "general": "general",
    "g": "general",
}


def get_route(route_cmd: str) -> Literal["function", "general", "documentation"]:
    route_cmd = route_cmd.lstrip("/")
    return ROUTE_CMD_MAP.get(route_cmd, "function")  # type: ignore