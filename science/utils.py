from typing import Dict, List, TypedDict, Optional, Union
from prisma import get_client
from prisma.models import ConversationMessage, UrlFunction


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
    """get the functions path as it will be exposed in the poly library"""
    if func["context"]:
        path = func["context"] + "." + func["name"]
    else:
        path = func["name"]
    return "poly." + path


def func_args(func: FunctionDto) -> List[str]:
    """get the args for a function from the headers and url"""
    rv = []
    for arg in func["arguments"]:
        rv.append(arg["name"] + ": " + arg["type"])
    return rv


def func_path_with_args(func: FunctionDto) -> str:
    return f"{func_path(func)}({', '.join(func_args(func))})"


def url_function_path(func: UrlFunction) -> str:
    return f"{func.context}.{func.name}"


def store_message(
    user_id: Optional[int], data: Dict[str, str]
) -> Optional[ConversationMessage]:
    if not user_id:
        return None

    db = get_client()
    create_input = {"userId": user_id, "role": data["role"], "content": data["content"]}
    return db.conversationmessage.create(data=create_input)  # type: ignore