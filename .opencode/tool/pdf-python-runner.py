#!/usr/bin/env python3
import ast
import builtins
import json
import os
import sys


ALLOWED_IMPORTS = {
    "reportlab",
    "pypdf",
    "pdfplumber",
    "math",
    "datetime",
    "textwrap",
    "re",
    "json",
    "decimal",
    "statistics",
    "itertools",
    "collections",
    "typing",
    "pathlib",
}

BLOCKED_NAMES = {
    "eval",
    "exec",
    "compile",
    "open",
    "input",
    "breakpoint",
    "__import__",
    "globals",
    "locals",
    "vars",
    "help",
    "exit",
    "quit",
}

BLOCKED_ATTRS = {
    "system",
    "popen",
    "spawn",
    "fork",
    "remove",
    "unlink",
    "rmdir",
    "removedirs",
    "rename",
    "replace",
    "chmod",
    "chown",
    "kill",
    "execv",
    "execve",
    "execvp",
    "execvpe",
    "walk",
    "scandir",
}

SAFE_BUILTINS = {
    name: getattr(builtins, name)
    for name in [
        "abs",
        "all",
        "any",
        "bool",
        "dict",
        "enumerate",
        "filter",
        "float",
        "int",
        "len",
        "list",
        "map",
        "max",
        "min",
        "print",
        "range",
        "reversed",
        "round",
        "set",
        "slice",
        "sorted",
        "str",
        "sum",
        "tuple",
        "zip",
        "isinstance",
        "Exception",
        "ValueError",
        "TypeError",
    ]
}


def root(module):
    return module.split(".", 1)[0]


def validate(tree):
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if root(alias.name) not in ALLOWED_IMPORTS:
                    raise ValueError(f"blocked import: {alias.name}")
        if isinstance(node, ast.ImportFrom):
            if not node.module or root(node.module) not in ALLOWED_IMPORTS:
                raise ValueError(f"blocked import: {node.module}")
        if isinstance(node, ast.Name) and node.id in BLOCKED_NAMES:
            raise ValueError(f"blocked name: {node.id}")
        if isinstance(node, ast.Attribute):
            if node.attr.startswith("__") or node.attr in BLOCKED_ATTRS:
                raise ValueError(f"blocked attribute: {node.attr}")


def limited_import(name, globals=None, locals=None, fromlist=(), level=0):
    if root(name) not in ALLOWED_IMPORTS:
        raise ImportError(f"blocked import: {name}")
    return builtins.__import__(name, globals, locals, fromlist, level)


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: pdf-python-runner.py <input.json>")

    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)

    output = data["output"]
    code = data["code"]
    watermark = data.get("watermark") or ""
    account = watermark

    os.makedirs(os.path.dirname(output), exist_ok=True)

    tree = ast.parse(code, filename="<pdf_python>")
    validate(tree)
    compiled = compile(tree, "<pdf_python>", "exec")

    env = {
        "__builtins__": {**SAFE_BUILTINS, "__import__": limited_import},
        "OUTPUT": output,
        "WATERMARK": watermark,
        "ACCOUNT_ID": account,
    }

    exec(compiled, env, env)

    if not os.path.exists(output):
        raise SystemExit("python executed but did not create OUTPUT")


if __name__ == "__main__":
    main()
