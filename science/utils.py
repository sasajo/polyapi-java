import openai
from typing import Dict, List, TypedDict, Optional, Union


class FunctionDto(TypedDict):
    id: str
    name: str
    context: str
    description: str
    arguments: List[Dict[str, str]]
    returnType: Optional[str]


class WebhookDto(TypedDict):
    id: str
    name: str
    context: str
    urls: List[str]


# HACK should have better name
def func_path(func: Union[FunctionDto, WebhookDto]) -> str:
    """ get the functions path as it will be exposed in the poly library
    """
    if func['context']:
        path = func['context'] + "." + func['name']
    else:
        path = func['name']
    return "poly." + path


def func_args(func: FunctionDto) -> List[str]:
    """ get the args for a function from the headers and url
    """
    rv = []
    for arg in func['arguments']:
        rv.append(arg['name'] + ": " + arg['type'])
    return rv


def func_path_with_args(func: FunctionDto) -> str:
    return f"{func_path(func)}({', '.join(func_args(func))})"


def webhook_prompt(hook: WebhookDto) -> str:
    parts = [func_path(hook)]
    for url in hook["urls"]:
        if hook['id'] in url:
            continue
        parts.append(f"url: {url}")
    return "\n".join(parts)


def get_completion_question(question: str) -> str:
    return "From the Poly API library, " + question


def get_completion_answer(functions: str, webhooks: str, question: str) -> str:
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "assistant", "content": "Include argument types. Be concise."},
            {"role": "assistant", "content": functions},
            {"role": "assistant", "content": webhooks},
            {"role": "user", "content": question},
        ],
    )
    return resp["choices"][0]["message"]["content"]
