// Heroku deployment script for badge authentication 304 Not Modified issue fix
// This script deploys fixes for the issue where 304 responses don't include user data

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const GIT_BRANCH = "badge-auth-304-fix";
const COMMIT_MESSAGE =
  "Fix badge authentication 304 Not Modified responses with cache busting";
const HEROKU_APP = "energy-audit-store";

console.log("Starting deployment of badge auth 304 fix...");

try {
  // Create a new branch
  console.log(`Creating new branch: ${GIT_BRANCH}`);
  execSync(`git checkout -b ${GIT_BRANCH}`, { stdio: "inherit" });

  // Add files to staging
  console.log("Adding files to staging...");
  execSync("git add src/hooks/useAuth.ts", { stdio: "inherit" });

  // Commit changes
  console.log("Committing changes...");
  execSync(`git commit -m "${COMMIT_MESSAGE}"`, { stdio: "inherit" });

  // Push to GitHub
  console.log("Pushing to GitHub...");
  execSync(`git push -u origin ${GIT_BRANCH}`, { stdio: "inherit" });

  // Deploy to Heroku
  console.log(`Deploying to Heroku app: ${HEROKU_APP}...`);
  execSync(
    `git push https://git.heroku.com/${HEROKU_APP}.git ${GIT_BRANCH}:main -f`,
    {
      stdio: "inherit",
    },
  );

  console.log("Deployment completed successfully!");
  console.log("Changes deployed:");
  console.log(
    "1. Added cache-busting headers to prevent 304 Not Modified responses",
  );
  console.log(
    "2. Added fallback to extract user data from token info if profile data missing",
  );
  console.log("3. Added improved logging for debugging response issues");

  // Checkout back to main branch
  console.log("Checking out back to main branch...");
  execSync("git checkout main", { stdio: "inherit" });
} catch (error) {
  console.error("Deployment failed:");
  console.error(error.message);
  process.exit(1);
}
