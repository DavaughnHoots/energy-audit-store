#!/bin/bash

# This script helps remove specific test and deploy scripts from Git tracking
# First, we'll find what test and deploy scripts are actually tracked in Git

echo "Creating list of tracked deploy/test scripts..."
git ls-files | grep -E "heroku_|\.bat$|\.ps1$|test-.*\.js|\.py$|implementation-plan|implementation-summary|fix-plan" > tracked_scripts.txt

echo "The following files are actually tracked in Git:"
cat tracked_scripts.txt
echo ""

echo "Creating removal commands for each tracked file..."
echo "#!/bin/bash" > execute_removal.sh
echo "" >> execute_removal.sh
echo "# Remove tracked files from Git (but keep them locally)" >> execute_removal.sh

# For each file in the list, create a git rm --cached command
while IFS= read -r file; do
  echo "git rm --cached \"$file\"" >> execute_removal.sh
done < tracked_scripts.txt

echo "" >> execute_removal.sh
echo "# Commit the changes" >> execute_removal.sh
echo "git commit -m \"Remove test and deploy scripts from Git tracking\"" >> execute_removal.sh
echo "" >> execute_removal.sh
echo "# Push to GitHub" >> execute_removal.sh
echo "git push origin fix/data-mishape-property" >> execute_removal.sh

chmod +x execute_removal.sh

echo "Ready to remove files from Git tracking!"
echo "Run ./execute_removal.sh to remove all listed files."
