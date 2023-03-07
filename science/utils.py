def full_func_path(func):
    if func.context:
        func_name = func.context + "." + func.alias
    else:
        func_name = func.alias
    return "poly." + func_name