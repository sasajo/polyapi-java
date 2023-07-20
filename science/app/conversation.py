from typing import List, Optional
from prisma import get_client
from prisma.models import ConversationMessage
from app.typedefs import MessageDict
from app.utils import (
    get_last_conversation,
    remove_punctuation,
)


def insert_prev_msgs(
    messages: List[MessageDict], prev_msgs: Optional[List[ConversationMessage]]
) -> None:
    """get the prev msg ids and insert into the MessageDict list"""
    if not prev_msgs:
        return

    # reverse the list then insert each msg at the beginning to maintain order
    for msg in reversed(prev_msgs):
        messages.insert(0, MessageDict(role=msg.role, content=msg.content))


PREVIOUS_INFO_PROMPT = """Answer "1" if the question seems incomplete suggesting the user is referencing information from the preceding conversation.

Answer "0" if not.

Here is the question:

"{}"
"""


def previous_message_referenced(
    user_id: str, question: str
) -> List[ConversationMessage]:
    """ get any previous messages referenced in the incoming question
    HACK for now this just determines if the question is incomplete
    and if it is includes the immediately preceding messages
    TODO in future this will be wicked smaht and find only the relevant messages
    from prior in the conversation
    """
    from app.completion import simple_chatgpt_question

    conversation = get_last_conversation(user_id)
    if not conversation:
        return []

    choice = simple_chatgpt_question(question)

    try:
        answer = int(remove_punctuation(choice["message"]["content"]))
    except (ValueError, TypeError):
        answer = 0

    if answer == 1:
        db = get_client()
        cmsgs = db.conversationmessage.find_many(
            where={"conversationId": conversation.id, "role": {"not": "info"}},
            order={"createdAt": "asc"},
        )
        return cmsgs
    else:
        return []