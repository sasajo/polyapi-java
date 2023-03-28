from typing import Any, Dict, List, TypedDict, Optional, Union
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


class MessageDict(TypedDict, total=False):
    role: str
    content: str
    function_ids: List[str]  # not required
    webhook_ids: List[str]  # not required


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


def log(message: Any) -> None:
    print(str(message), flush=True)


def store_message(
    user_id: Optional[int], data: MessageDict
) -> Optional[ConversationMessage]:
    if not user_id:
        return None

    db = get_client()
    create_input = {"userId": user_id, "role": data["role"], "content": data["content"]}

    if data.get("function_ids"):
        create_input["functions"] = {
            "create": [
                {"functionPublicId": fid}
                for fid in data["function_ids"]
            ]
        }
    if data.get("webhook_ids"):
        create_input["webhooks"] = {
            "create": [
                {"webhookPublicId": wid}
                for wid in data["webhook_ids"]
            ]
        }

    rv = db.conversationmessage.create(data=create_input)  # type: ignore
    return rv


def clear_conversation(user_id: int):
    db = get_client()
    db.functiondefined.delete_many(where={"message": {"userId": user_id}})  # type: ignore
    db.webhookdefined.delete_many(where={"message": {"userId": user_id}})  # type: ignore
    db.conversationmessage.delete_many(where={"userId": user_id})