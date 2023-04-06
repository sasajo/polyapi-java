import os
from enum import Enum, unique

# port of the nestjs server
NODE_API_URL = os.environ.get("NODE_API_URL", "http://localhost:80")

# Fine tune model sucks for now, just use ChatGPT
FINE_TUNE_MODEL = os.environ.get("FINE_TUNE_MODEL")


# names for ConfigVariables
@unique
class VarName(Enum):
    keyword_similarity_threshold = "keyword_similarity_threshold"
    function_match_limit = "function_match_limit"