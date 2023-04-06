import json
import openai
from thefuzz import fuzz
from typing import Optional, Tuple, Union, List
from typedefs import StatsDict, ExtractKeywordDto, FunctionDto, WebhookDto
from utils import func_path, log

# how similar does a function or webhook have to be to be considered a match?
# scale is 0-100
# HACK was 60 just trying 40
SIMILARITY_THRESHOLD = 55

# NOT USED CURRENTLY
# DESC_SIMILARITY_THRESHOLD = 50

ALT1_KEYWORD_PROMPT = """
I will give you a prompt, respond to me with only a list of the relevant keywords from the prompt I give you.
Assume that the keywords will be used to execute a search against a database of function records.

Here is the prompt:

{prompt}
"""


ALT2_KEYWORD_PROMPT = """
For the following prompt, give me back the top 4 keywords and the top synonym for each keyword.
Return both keywords and synonyms in a single comma-separated list.

Here is the prompt:

{prompt}
"""

KEYWORD_PROMPT = """For the following prompt, give me back both the keywords from my prompt and semantically similar keywords.
This will be used to power an API discovery service.
Each keyword must be a single word.
Keep the list to the top 8 keywords relevant to APIs.
Don't include "API" "resource" as keywords.
Include all of the likely HTTP methods for this prompt, for example many times search is done using a POST.

If the prompt is in a different language, translate and return the keywords in English.

Here is the prompt:

{prompt}


"""


def get_similarity_threshold() -> int:
    return SIMILARITY_THRESHOLD


def extract_keywords(question: str) -> Optional[ExtractKeywordDto]:
    prompt = KEYWORD_PROMPT.format(prompt=question)
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.01,  # let's try making things SUPER deterministic
        messages=[
            {"role": "user", "content": prompt},
            {
                "role": "user",
                "content": 'Return JSON with keys "keywords", "semantically_similar_keywords", and "http_methods". Each value should be a string.',
            },
        ],
    )
    content = resp["choices"][0]["message"]["content"]
    try:
        rv = json.loads(content)
    except Exception as e:
        log("Non-JSON response from OpenAI", e, content, sep="\n")
        return None

    # sometimes OpenAI returns lists instead of strings
    # let's coerce them to strings
    for key in ["keywords", "semantically_similar_keywords", "http_methods"]:
        if isinstance(rv[key], list):
            rv[key] = " ".join(rv[key])

    return rv


BLACKLISTED = [
    "api",
]


def remove_blacklist(keywords: str) -> str:
    for blacklist in BLACKLISTED:
        keywords = keywords.replace(blacklist, "")
    return keywords


def keywords_similar(
    keywords: str, func: Union[FunctionDto, WebhookDto], debug=False
) -> Tuple[bool, int]:
    if not keywords:
        # when we have no keywords, just assume everything matches for now
        return True, -1

    keywords = keywords.lower()

    func_parts = []
    if func.get("context"):
        func_parts.append(func["context"])
    if func.get("name"):
        func_parts.append(func["name"])
    func_str = " ".join(func_parts).lower()

    # HACK just add description for now
    if func.get("description"):
        func_str += f"\n{func['description']}"

    keywords = remove_blacklist(keywords)

    similarity_score = fuzz.token_set_ratio(keywords, func_str)
    if debug:
        log(keywords, similarity_score, func_str)

    # separate description ratio
    # commented out for now
    #
    # desc_ratio = 0
    # if func.get("description"):
    #     desc_ratio = fuzz.partial_ratio(keywords, func["description"])
    #     if debug:
    #         log(keywords, desc_ratio, func['description'])

    return similarity_score > get_similarity_threshold(), similarity_score


def top_5_keywords(
    items: List[Union[FunctionDto, WebhookDto]], keyword_data: ExtractKeywordDto
) -> Tuple[List[Union[FunctionDto, WebhookDto]], StatsDict]:
    # for now ignore http_methods
    top_5, keyword_stats = _get_top_5(items, keyword_data["keywords"])

    semantic_top_5, semantic_stats = _get_top_5(
        items, keyword_data.get("semantically_similar_keywords", "")
    )
    top_5_uuids = {x["id"] for x in top_5}
    for top in semantic_top_5:
        if len(top_5) >= 5:
            break

        if top['id'] not in top_5_uuids:
            top_5.append(top)

    stats = {"keyword_extraction": keyword_data}
    stats["keyword_stats"] = keyword_stats
    stats["semantically_similar_stats"] = semantic_stats
    stats["match_count"] = _generate_match_count(stats)

    # TODO
    return top_5, stats


def _generate_match_count(stats: StatsDict) -> int:
    threshold = get_similarity_threshold()
    matches = set()
    for name, score in stats["keyword_stats"]["scores"]:
        if score > threshold:
            matches.add(name)
    for name, score in stats["semantically_similar_stats"]["scores"]:
        if score > threshold:
            matches.add(name)
    return len(matches)


def _get_top_5(
    items: List[Union[FunctionDto, WebhookDto]], keywords: str
) -> Tuple[List[Union[FunctionDto, WebhookDto]], StatsDict]:
    threshold = get_similarity_threshold()

    if not keywords:
        return [], {"total": len(items), "match_count": 0, "scores": []}

    items_with_scores = []
    for item in items:
        _, score = keywords_similar(keywords, item)
        items_with_scores.append((item, score))

    items_with_scores = sorted(items_with_scores, key=lambda x: x[1], reverse=True)
    top_5 = [item for item, score in items_with_scores if score > threshold]

    stats = _get_stats(items_with_scores)
    return top_5[:5], stats


def _get_stats(items_with_scores: List[Tuple[Union[FunctionDto, WebhookDto], int]]) -> StatsDict:
    stats: StatsDict = {"total": len(items_with_scores)}
    match_count = 0

    scores: List[Tuple[str, int]] = []
    for item, score in items_with_scores:
        if score > get_similarity_threshold():
            match_count += 1
        scores.append((func_path(item), score))

    stats["scores"] = scores
    stats["match_count"] = match_count
    return stats
