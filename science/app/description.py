from typing import Dict, Set, Union
import json
import openai
from app.typedefs import DescInputDto, DescOutputDto, ErrorDto
from app.utils import func_path, log
from prisma import get_client

# trim
# The name should allow me to understand if I am doing a get, post, delete, it should include a verb and the object. It should use the name of the system that it's for follow a convention of product.verbObject if possible. It should be as concise as possible and can use common product acronyms such as MS for microsoft, SFDC for salesforce etc... The name should be as short as possible and ideally only consist of two words and one "." Lastly dont use the same word for the name as found in the context, default to only one word if that is the case.

# The description should use keywords that makes search efficient. It can be a little redundant if that adds keywords but needs to remain human readable. It should be exhaustive in listing what it does but it should be ideally two to three sentences.
# Don't repeat words in both the name and the context. For example, if the context is "comms.twilio" and the name is "twilio.sendSMS", then the name should be "sendSMS" and not "twilio.sendSMS".


prompt_template = """
I will provide you information about an API call.

Please give me a name, context, and description for the API call.

name and context (classification) can use '.' notation but cannot have any spaces or dashes.

Don't use the same word in both the name and the context.

Here are the existing contexts and names separated by dots:

{contexts}

Try to use an existing context if possible.

Here is the API call:

{short_description}
{method} {url}

Request Payload:
{payload}

Response Payload:
{response}

Please return JSON with three keys: context, name, description
"""


def get_function_description(data: DescInputDto) -> Union[DescOutputDto, ErrorDto]:
    contexts = _get_context_and_names()
    short = data.get("short_description", "")
    short = f"User given name: {short}" if short else ""
    prompt = prompt_template.format(
        url=data.get("url", ""),
        method=data.get("method", ""),
        short_description=short,
        payload=data.get("payload", "None"),
        response=data.get("response", "None"),
        contexts="\n".join(contexts),
    )
    prompt_msg = {"role": "user", "content": prompt}
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo", temperature=0.2, messages=[prompt_msg]
    )
    completion = resp["choices"][0]["message"]["content"].strip()
    try:
        rv = _parse_openai_response(completion)
    except json.JSONDecodeError:
        log_error(data, completion, prompt)
        return {"error": "Error parsing JSON from OpenAI: " + completion}

    if not rv["context"] or not rv["name"] or not rv["description"]:
        log_error(data, completion, prompt)

    return rv


def _get_context_and_names() -> Set[str]:
    db = get_client()
    funcs = {
        ".".join([f.context, f.name]).lstrip(".") for f in db.urlfunction.find_many()
    }
    return funcs


def log_error(data: DescInputDto, completion: str, prompt: str) -> None:
    parts = [
        "Error getting context/name/description from OpenAI",
        "input:",
        str(data),
        "output:",
        completion,
        "prompt:",
        prompt,
    ]
    log("\n".join(parts))


def _parse_openai_response(completion: str) -> DescOutputDto:
    data: Dict = json.loads(completion)

    rv = DescOutputDto(
        context=data.get("context", ""),
        name=data.get("name", ""),
        description=data.get("description", ""),
        openai_response=completion,
    )

    # make sure there are no spaces or dashes in context or name
    rv["name"] = rv["name"].replace(" ", "").replace("-", "")
    rv["context"] = rv["context"].replace(" ", "").replace("-", "")

    # parts = completion.split("\n")
    # for idx in range(len(parts)):
    #     part = parts[idx]
    #     part = part.strip()
    #     part_lowered = part.lower()  # sometimes OpenAI returns "context:", sometimes "Context:"

    #     if part_lowered.startswith("context:"):
    #         rv["context"] = part.split(":")[1].strip()
    #         if not rv["context"] and _value_on_next_line(parts, idx):
    #             # next line is context, grab it and move forward!
    #             rv['context'] = parts[idx + 1].strip()
    #             idx += 1

    #     elif part_lowered.startswith("name:"):
    #         rv["name"] = part.split(":")[1].strip()
    #         if not rv["name"] and _value_on_next_line(parts, idx):
    #             # next line is name, grab it and move forward!
    #             rv['name'] = parts[idx + 1].strip()
    #             idx += 1

    #     elif part_lowered.startswith("description:"):
    #         rv["description"] = part.split(":")[1].strip()
    #         if not rv["description"] and _value_on_next_line(parts, idx):
    #             # next line is description, grab it and move forward!
    #             rv['description'] = parts[idx + 1].strip()
    #             idx += 1

    #     idx += 1

    return rv


def _value_on_next_line(parts: list, idx: int) -> bool:
    try:
        next_line = parts[idx + 1].strip()
    except IndexError:
        return False

    next_line = next_line.lower()
    return (
        next_line
        and not next_line.startswith("context:")
        and not next_line.startswith("name:")
        and not next_line.startswith("description:")
    )
