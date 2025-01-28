# pip install pathspec

import os
import sys
import argparse
from pathlib import Path
import pathspec

def load_gitignore(gitignore_path):
    """
    Load and compile the .gitignore patterns using pathspec.
    """
    if not gitignore_path.exists():
        return pathspec.PathSpec.from_lines('gitwildmatch', [])

    with gitignore_path.open('r') as f:
        lines = f.readlines()
    return pathspec.PathSpec.from_lines('gitwildmatch', lines)

def is_ignored(path, spec, base_path):
    """
    Determine if a path is ignored based on the compiled spec.
    """
    try:
        relative_path = path.relative_to(base_path)
    except ValueError:
        # If path is not relative to base_path, do not ignore
        return False
    return spec.match_file(str(relative_path))

def generate_tree(base_path, spec, prefix=''):
    """
    Recursively generate the tree structure as a list of strings.
    """
    entries = sorted([e for e in base_path.iterdir()], key=lambda e: (e.is_file(), e.name.lower()))
    entries = [e for e in entries if not is_ignored(e, spec, base_path)]

    tree_lines = []
    for index, entry in enumerate(entries):
        connector = '├── ' if index < len(entries) - 1 else '└── '
        tree_lines.append(prefix + connector + entry.name)
        if entry.is_dir():
            extension = '│   ' if index < len(entries) - 1 else '    '
            tree_lines.extend(generate_tree(entry, spec, prefix + extension))
    return tree_lines

def main():
    parser = argparse.ArgumentParser(description='Generate a project tree structure excluding files/folders from .gitignore.')
    parser.add_argument('directory', nargs='?', default='.', help='Directory to generate the tree from (default: current directory)')
    parser.add_argument('-o', '--output', default='project_tree.txt', help='Output file name (default: project_tree.txt)')
    parser.add_argument('-g', '--gitignore', default='.gitignore', help='Path to .gitignore file (default: .gitignore in the root directory)')
    args = parser.parse_args()

    base_path = Path(args.directory).resolve()
    gitignore_path = base_path / args.gitignore

    spec = load_gitignore(gitignore_path)

    tree = [base_path.name]
    tree.extend(generate_tree(base_path, spec))

    output_file = Path(args.output)
    with output_file.open('w', encoding='utf-8') as f:
        for line in tree:
            f.write(line + '\n')

    print(f"Project tree has been written to {output_file}")

if __name__ == '__main__':
    main()
