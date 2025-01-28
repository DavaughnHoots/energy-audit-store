import os
import argparse
from pathlib import Path
import pathspec

def load_gitignore(gitignore_path):
    """
    Load and compile the .gitignore patterns using pathspec.
    """
    if not gitignore_path.exists():
        print(f"No .gitignore found at {gitignore_path}. Proceeding without ignoring any files.")
        return pathspec.PathSpec.from_lines('gitwildmatch', [])
    
    with gitignore_path.open('r') as f:
        lines = f.readlines()
    spec = pathspec.PathSpec.from_lines('gitwildmatch', lines)
    print(f"Loaded .gitignore from {gitignore_path}")
    return spec

def is_valid_extension(file_path, allowed_extensions):
    """
    Check if the file has one of the allowed extensions.
    """
    return file_path.suffix.lower() in allowed_extensions

def should_ignore_dir(dir_name, ignored_dirs):
    """
    Check if the directory should be ignored.
    """
    return dir_name in ignored_dirs

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

def concatenate_files(base_path, spec, output_file, allowed_extensions, ignored_dirs, verbose=False):
    """
    Traverse the directory, concatenate file contents into output_file,
    including only files with allowed_extensions and ignoring ignored_dirs.
    Additionally, respect .gitignore patterns.
    """
    with output_file.open('w', encoding='utf-8', errors='replace') as outfile:
        for root, dirs, files in os.walk(base_path):
            current_path = Path(root)
            
            # Modify dirs in-place to skip ignored directories and those ignored by .gitignore
            dirs[:] = [
                d for d in dirs 
                if not should_ignore_dir(d, ignored_dirs) and not is_ignored(current_path / d, spec, base_path)
            ]
            
            for file in sorted(files):
                file_path = current_path / file
                
                # Check if the file is ignored by .gitignore
                if is_ignored(file_path, spec, base_path):
                    if verbose:
                        print(f"Skipping ignored file by .gitignore: {file_path}")
                    continue
                
                # Check if the file has an allowed extension
                if not is_valid_extension(file_path, allowed_extensions):
                    if verbose:
                        print(f"Skipping file with unsupported extension: {file_path}")
                    continue
                
                if file_path.is_symlink():
                    if verbose:
                        print(f"Skipping symlink: {file_path}")
                    continue  # Skip symbolic links to avoid potential loops
                
                try:
                    # Attempt to read as text
                    with file_path.open('r', encoding='utf-8') as f:
                        content = f.read()
                except (UnicodeDecodeError, PermissionError) as e:
                    if verbose:
                        print(f"Skipping unreadable or binary file: {file_path} ({e})")
                    continue
                
                # Write a separator with the file path
                separator = f"\n\n----- Start of {file_path.relative_to(base_path)} -----\n\n"
                outfile.write(separator)
                outfile.write(content)
                separator_end = f"\n\n----- End of {file_path.relative_to(base_path)} -----\n\n"
                outfile.write(separator_end)
                
                if verbose:
                    print(f"Appended: {file_path}")
    
    print(f"\nAll eligible file contents have been concatenated into {output_file}\n")

def main():
    parser = argparse.ArgumentParser(
        description=(
            'Concatenate contents of specific project files into a single file, '
            'ignoring specified directories and respecting .gitignore.'
        )
    )
    parser.add_argument(
        'directory',
        nargs='?',
        default='.',
        help='Directory to process (default: current directory)'
    )
    parser.add_argument(
        '-o', '--output',
        default='concatenated_project.txt',
        help='Output file name (default: concatenated_project.txt)'
    )
    parser.add_argument(
        '-g', '--gitignore',
        default='.gitignore',
        help='Path to .gitignore file (default: .gitignore in the root directory)'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    base_path = Path(args.directory).resolve()
    gitignore_path = base_path / args.gitignore
    output_file = Path(args.output).resolve()
    
    # Define allowed file extensions (in lowercase for case-insensitive matching)
    allowed_extensions = {'.ts', '.tsx', '.validator', '.txt', '.css', '.html', '.js'}
    
    # Define directories to ignore
    ignored_dirs = {'.trunk', 'node_modules'}
    
    # Load .gitignore patterns
    spec = load_gitignore(gitignore_path)
    
    concatenate_files(
        base_path=base_path,
        spec=spec,
        output_file=output_file,
        allowed_extensions=allowed_extensions,
        ignored_dirs=ignored_dirs,
        verbose=args.verbose
    )

if __name__ == '__main__':
    main()
