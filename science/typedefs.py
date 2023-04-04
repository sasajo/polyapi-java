from typing import TypedDict


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
    openai_response: str


class ErrorDto(TypedDict):
    error: str
