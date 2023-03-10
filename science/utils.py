import openai
from typing import List
from prisma.models import PolyFunction
from urllib.parse import urlparse, parse_qs


def func_path(func: PolyFunction) -> str:
    """ get the functions path as it will be exposed in the poly library
    """
    if func.context:
        func_name = func.context + "." + func.alias
    else:
        func_name = func.alias
    return "poly." + func_name


def func_args(func: PolyFunction) -> List[str]:
    """ get the args for a function from the url query params
    TODO also get args from the headers
    """
    parsed = urlparse(func.url)
    qs = parse_qs(parsed.query)
    rv = []
    for value_list in qs.values():
        value = value_list[0]
        if value.startswith("{{") and value.endswith("}}"):
            rv.append(value[2:-2])
        else:
            # this is a static query param, NOT one we want to expose as a variable
            pass
    return rv


def func_path_with_args(func) -> str:
    return f"{func_path(func)}({', '.join(func_args(func))})"


def get_function_completion_question(question: str) -> str:
    return "From the Poly API library, " + question


def get_function_completion_answer(base_prompt: str, question: str) -> str:
    resp = openai.ChatCompletion.create(
        messages=[
            {"role": "assistant", "content": base_prompt},
            {"role": "user", "content": question},
        ],
    )
    return resp["choices"][0]["message"]["content"]