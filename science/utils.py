import openai
from typing import Dict, List, TypedDict, Optional, Union
from prisma import Prisma
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


def webhook_prompt(hook: WebhookDto) -> str:
    parts = [func_path(hook)]
    for url in hook["urls"]:
        if hook["id"] in url:
            continue
        parts.append(f"url: {url}")
    return "\n".join(parts)


def get_completion_question(question: str) -> str:
    return "From the Poly API library, " + question


def store_message(
    db: Prisma, user_id: Optional[int], data: Dict[str, str]
) -> Optional[ConversationMessage]:
    if not user_id:
        return None
    create_input = {"userId": user_id, "role": data["role"], "content": data["content"]}
    return db.conversationmessage.create(data=create_input)  # type: ignore


def get_conversation_answer(
    db: Prisma, user_id: int, messages: List[ConversationMessage], question: str
):
    priors: List[Dict[str, str]] = []
    for message in messages:
        priors.append({"role": message.role, "content": message.content})

    question_message = {"role": "user", "content": question}
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=priors + [question_message],
    )
    store_message(db, user_id, question_message)
    answer = resp["choices"][0]["message"]["content"]
    store_message(db, user_id, {"role": "assistant", "content": answer})
    return answer


def get_completion_prompt_messages(
    functions: str, webhooks: str, question: str
) -> List[Dict]:
    return [
        {"role": "system", "content": "Include argument types. Be concise."},
        {"role": "assistant", "content": functions},
        {"role": "assistant", "content": webhooks},
        {"role": "user", "content": question},
    ]


def get_completion_answer(
    db: Prisma, user_id: int, functions: str, webhooks: str, question: str
) -> str:
    messages = get_completion_prompt_messages(functions, webhooks, question)

    model = "gpt-3.5-turbo"
    print(f"Using model: {model}")
    resp = openai.ChatCompletion.create(model=model, messages=messages)
    answer = resp["choices"][0]["message"]["content"]

    for message in messages:
        store_message(db, user_id, message)
    store_message(db, user_id, {"role": "assistant", "content": answer})

    return answer
