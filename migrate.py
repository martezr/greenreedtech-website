import os
import re

CONTENT_DIR = "src/content/blog"

def generate_description(content):
    # Take first non-empty paragraph
    for line in content.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            return line[:140]
    return "Blog post"

def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.startswith("---"):
        return

    parts = text.split("---", 2)
    if len(parts) < 3:
        return

    _, frontmatter, body = parts

    # Remove draft
    frontmatter = re.sub(r"\n?draft:\s*(true|false)", "", frontmatter)

    # Add description if missing
    if "description:" not in frontmatter:
        desc = generate_description(body)
        frontmatter += f'\ndescription: "{desc}"\n'

    new_text = f"---{frontmatter}---{body}"

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)

def main():
    for root, _, files in os.walk(CONTENT_DIR):
        for file in files:
            if file.endswith(".md"):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()