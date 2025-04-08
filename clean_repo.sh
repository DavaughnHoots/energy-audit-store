#!/bin/bash

# Add all the new gitignore patterns
git add .gitignore

# Commit the change
git commit -m "Update gitignore to exclude test and deploy scripts"

# Push to GitHub 
git push origin fix/data-mishape-property

echo "Changes pushed to GitHub. The .gitignore is now updated."
echo "Future changes to test and deploy scripts won't be tracked."
echo ""
echo "For existing files on GitHub that should be removed, you'll need to:"
echo "1. Check your GitHub repository directly"
echo "2. For each file that needs to be removed but kept locally:"
echo "   git rm --cached path/to/file"
echo "3. Commit the changes: git commit -m \"Remove test and deploy scripts\""
echo "4. Push to GitHub: git push origin fix/data-mishape-property"
