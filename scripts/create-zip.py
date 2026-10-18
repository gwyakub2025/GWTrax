import os
import zipfile

def create_zip():
    output_dir = 'public'
    os.makedirs(output_dir, exist_ok=True)
    zip_path = os.path.join(output_dir, 'gwtrax-codebase.zip')
    
    ignore_dirs = {
        'node_modules',
        '.git',
        '.playwright-cli',
        '.aistudio',
        'dist',
        'build',
        'coverage',
        '__pycache__'
    }
    
    ignore_files = {
        'gwtrax-codebase.zip'
    }

    print(f"Creating zip archive at {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Prune ignored directories in place
            dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.git')]
            
            for file in files:
                if file in ignore_files or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                # Compute relative archive path
                archive_name = os.path.relpath(file_path, '.')
                if archive_name.startswith('./'):
                    archive_name = archive_name[2:]
                zipf.write(file_path, archive_name)
                
    file_size_kb = os.path.getsize(zip_path) / 1024
    print(f"Zip created successfully! File size: {file_size_kb:.2f} KB")

if __name__ == '__main__':
    create_zip()
