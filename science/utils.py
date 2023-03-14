import re
import openai
from typing import List
from prisma.models import UrlFunction


RE_CURLY = re.compile("{{(.*?)}}")


def func_path(func: UrlFunction) -> str:
    """ get the functions path as it will be exposed in the poly library
    """
    if func.context:
        func_name = func.context + "." + func.name
    else:
        func_name = func.name
    return "poly." + func_name


def func_args(func: UrlFunction) -> List[str]:
    """ get the args for a function from the headers and url
    """
    header_args = RE_CURLY.findall(func.headers) if func.headers else []
    url_args = RE_CURLY.findall(func.url)
    return header_args + url_args


def func_path_with_args(func) -> str:
    return f"{func_path(func)}({', '.join(func_args(func))})"


def get_function_completion_question(question: str) -> str:
    return "From the Poly API library, " + question


def get_function_completion_answer(base_prompt: str, question: str) -> str:
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "assistant", "content": base_prompt},
            {"role": "user", "content": question},
        ],
    )
    return resp["choices"][0]["message"]["content"]
