file_paths = {
    "code": r"C:\Users\katov\OneDrive\Skrivebord\BDO Worker Tool\src\code.js",
    "html": r"C:\Users\katov\OneDrive\Skrivebord\BDO Worker Tool\src\index.html",
    "css": r"C:\Users\katov\OneDrive\Skrivebord\BDO Worker Tool\src\styles.css"
}

# Define new file paths for saving the updated files
updated_files = {
    "code": r"C:\Users\katov\OneDrive\Skrivebord\BDO Worker Tool",
    "html": r"C:\Users\katov\OneDrive\Skrivebord\BDO Worker Tool", 
    "css": r"C:\Users\katov\OneDrive\Skrivebord\BDO Worker Tool" 
}

# Function to update terminology in a file
def update_file(file_path, updated_path, replacements):
    # Read the file content
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    
    # Replace terminology
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    # Write the updated content to the new file
    with open(updated_path, "w", encoding="utf-8") as file:
        file.write(content)

# Define replacements for terminology changes
replacements = {
    "buy": "invest",
    "Buy House": "Invest in Node",
    "House bought": "Node invested",
    "bought": "invested",
    "boughtNodes": "investedNodes",
    "Buy Button": "Invest Button",
    "bought node": "invested node"
}

# Update each file with the replacements
update_file(file_paths["code"], updated_files["code"], replacements)
update_file(file_paths["html"], updated_files["html"], replacements)
update_file(file_paths["css"], updated_files["css"], replacements)

print("Files updated successfully!")
