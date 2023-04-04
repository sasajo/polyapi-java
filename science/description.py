from typing import Union
import openai
from typedefs import DescInputDto, DescOutputDto, ErrorDto
from utils import log


prompt_template = """
For each of the following prompts, I will provide you information about an API call. I want you to help me name, classify and describe it.

I want your response to include three properties:
context:
name:
description:

context (classification) can use '.' notation, for example comms.messaging, but they cannot have any spaces. It should be standard words that most people would understand, and represent a hierarchical directory. It can be one word if the industry is small, but can be two words if the industry is large.

The name can use '.' notation, for example twilio.sendSMS , but they cannot have any spaces. The name should allow me to understand if I am doing a get, post, delete, it should include a verb and the object. It should use the name of the system that it's for follow a convention of product.verbObject if possible. It should be as concise as possible and can use common product acronyms such as MS for microsoft, SFDC for salesforce etc... The name should be as short as possible and ideally only consist of two words and one "." Lastly dont use the same word for the name as found in the context, default to only one word if that is the case.

The description should use keywords that makes search efficient. It can be a little redundant if that adds keywords but needs to remain human readable. It should be exhaustive in listing what it does but it should be ideally two to three sentences.

Don't repeat words in both the name and the context. For example, if the context is "comms.twilio" and the name is "twilio.sendSMS", then the name should be "sendSMS" and not "twilio.sendSMS".

Here is the API call:

User Given Name: {short_description}
{method} {url}

Request Payload:
{payload}

Response Payload:
{response}
"""


def get_function_description(data: DescInputDto) -> Union[DescOutputDto, ErrorDto]:
    prompt = prompt_template.format(
        url=data.get("url", ""),
        method=data.get("method", ""),
        short_description=data.get("short_description", ""),
        payload=data.get("payload", ""),
        response=data.get("response", "")
    )
    # print(prompt)
    system_msg = {"role": "system", "content": "Include argument types. Be concise."}
    prompt_msg = {"role": "user", "content": prompt}
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[system_msg, prompt_msg]
    )
    completion = resp["choices"][0]["message"]["content"]
    rv = _parse_function_description(completion)
    if not rv["context"] or rv['name'] or rv['description']:
        parts = ["Error getting context/name/description from OpenAI", "input:", str(data), "output:", completion]
        log("\n".join(parts))
    return rv


def _parse_function_description(completion: str) -> DescOutputDto:
    rv = DescOutputDto(context="", name="", description="", openai_response=completion)
    parts = completion.split("\n")
    for idx in range(len(parts)):
        part = parts[idx]
        part = part.strip()
        part_lowered = part.lower()  # sometimes OpenAI returns "context:", sometimes "Context:"

        if part_lowered.startswith("context:"):
            rv["context"] = part.split(":")[1].strip()
            if not rv["context"] and _value_on_next_line(parts, idx):
                # next line is context, grab it and move forward!
                rv['context'] = parts[idx + 1].strip()
                idx += 1

        elif part_lowered.startswith("name:"):
            rv["name"] = part.split(":")[1].strip()
            if not rv["name"] and _value_on_next_line(parts, idx):
                # next line is name, grab it and move forward!
                rv['name'] = parts[idx + 1].strip()
                idx += 1

        elif part_lowered.startswith("description:"):
            rv["description"] = part.split(":")[1].strip()
            if not rv["description"] and _value_on_next_line(parts, idx):
                # next line is description, grab it and move forward!
                rv['description'] = parts[idx + 1].strip()
                idx += 1

        idx += 1

    return rv


def _value_on_next_line(parts: list, idx: int) -> bool:
    try:
        next_line = parts[idx + 1].strip()
    except IndexError:
        return False

    next_line = next_line.lower()
    return next_line and not next_line.startswith("context:") and not next_line.startswith("name:") and not next_line.startswith("description:")