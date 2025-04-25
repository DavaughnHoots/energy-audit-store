# GitHub Push Guide for Energy Audit Store

This guide provides instructions on how to push your local changes to your GitHub repository at `https://github.com/DavaughnHoots/energy-audit-store`.

## Option 1: Using the Interactive Push Options Tool (Recommended)

I've created an interactive script that helps you push your code to GitHub with various options:

```bash
# Run the GitHub push options utility
npm run github-options
```

The script will:
1. Show your current branch and available branches
2. Provide several options for how to handle the push:
   - Push the current branch with the same name
   - Create a new branch on GitHub
   - Replace the GitHub main branch (force push)
   - Push as a pull request branch

This is the recommended approach as it guides you through the process and handles different edge cases.

## Option 2: Direct Git Commands

### Push to an existing branch with the same name

If you want to push your current branch to GitHub with the same name:

```bash
git push github local-heroku-v655:local-heroku-v655
```

Replace `local-heroku-v655` with your current branch name if different.

### Create a new branch on GitHub

To create a new branch on GitHub:

```bash
git push github local-heroku-v655:feature/admin-dashboard-analysis
```

Replace `feature/admin-dashboard-analysis` with your desired branch name.

### Replace the GitHub main branch (force push)

If you want to replace the content of the main branch on GitHub (use with caution):

```bash
git push -f github local-heroku-v655:main
```

### Create a pull request

To create a branch for a pull request:

```bash
git push github local-heroku-v655:feature/admin-dashboard-tools

# Then visit:
# https://github.com/DavaughnHoots/energy-audit-store/pull/new/feature/admin-dashboard-tools
```

## Option 3: Push Current Branch Using push-to-github.js

You can also use the simplified GitHub push script:

```bash
npm run push-github
```

This script will guide you through the process of pushing to GitHub, including creating a repository if needed.

## After Pushing

After you've pushed your changes, you can:

1. Go to your GitHub repository: https://github.com/DavaughnHoots/energy-audit-store
2. Navigate to the branch you pushed to
3. Create a pull request if you want to merge into main
4. View your new analysis tools and utilities

## Troubleshooting

If you encounter any issues:

### Authentication Problems

If you're prompted for credentials and have issues:

```bash
# Set up credential caching
git config --global credential.helper cache

# Or use SSH instead of HTTPS
git remote set-url github git@github.com:DavaughnHoots/energy-audit-store.git
```

### Push Rejected

If your push is rejected:

```bash
# Pull first
git pull github main --rebase
git push github local-heroku-v655:main
```

### View Current Configuration

To see what remotes are configured:

```bash
git remote -v
```

You should see both heroku and github remotes listed.
