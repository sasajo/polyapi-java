""" logging related functions
"""


def log(*args, **kwargs) -> None:
    try:
        print(*args, **kwargs, flush=True)
    except UnicodeEncodeError:
        print("UnicodeEncodeError! TODO FIXME")