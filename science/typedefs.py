from typing import Dict, Tuple, TypedDict, List, Literal


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


class ExtractKeywordDto(TypedDict):
    keywords: str
    semantically_similar_keywords: str
    http_methods: str


class FunctionDto(TypedDict):
    id: str
    context: str
    name: str
    description: str
    arguments: List[Dict[str, str]]


class WebhookDto(TypedDict):
    id: str
    context: str
    name: str
    urls: List[str]


class MessageDict(TypedDict, total=False):
    role: str
    content: str
    function_ids: List[str]  # not required
    webhook_ids: List[str]  # not required


class ChatGptChoice(TypedDict):
    message: MessageDict  # no function_ids or webhook_ids
    finish_reason: Literal['stop', 'length', 'content_filter', None]
    index: int


class StatsDict(TypedDict, total=False):
    prompt: str
    total: int
    match_count: int
    scores: List[Tuple[str, int]]
    keyword_extraction: ExtractKeywordDto
    keyword_stats: 'StatsDict'
    semantically_similar_stats: 'StatsDict'
    config: Dict