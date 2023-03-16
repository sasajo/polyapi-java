import json
from typing import TypedDict, Union
import openai


class DescInputDto(TypedDict):
    url: str
    method: str
    short_description: str
    payload: str
    response: str


class DescOutputDto(TypedDict):
    name: str
    context: str
    description: str


class ErrorDto(TypedDict):
    error: str


prompt = "FOOBAR"


def get_function_description(data: DescInputDto) -> Union[DescOutputDto, ErrorDto]:
    system_msg = {"role": "system", "content": "Include argument types. Be concise."}
    prompt_msg = {"role": "user", "content": prompt}
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[system_msg, prompt_msg]
    )
    first_choice = resp["choices"][0]["message"]["content"]
    try:
        return json.loads(first_choice)
    except json.JSONDecodeError:
        return {"error": f"Here's what the Science server returned: {first_choice}"}