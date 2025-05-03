# Energy Audit Store - Documentation

Welcome to the Energy Audit Store documentation. This collection of guides will help you set up, deploy, and maintain the Energy Audit Store application.

## Available Documentation

| Document | Description |
|----------|-------------|
| [User Manual](USER_MANUAL.md) | Comprehensive guide for setting up and deploying the application |
| [Quick Setup Guide](QUICK_SETUP_GUIDE.md) | Condensed checklist-style guide for quick reference |
| [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) | Solutions for common issues and problems |
| [Product Search Deployment Guide](PRODUCT_SEARCH_DEPLOYMENT_GUIDE.md) | Specific guidance for deploying the product search feature |

## Important Deployment Notes

⚠️ **CRITICAL INFORMATION** ⚠️

The Energy Audit Store **MUST** be deployed manually following the exact steps outlined in the documentation. 

**DO NOT USE AUTOMATED DEPLOYMENT SCRIPTS.** 

The correct deployment process is:
1. Create a new branch
2. Push changes to Git
3. Push to Heroku manually

This is the only way to ensure a successful deployment without encountering errors.

## Setup Overview

The Energy Audit Store consists of two main components:

1. **Frontend**: React application with TypeScript and Vite
2. **Backend**: Node.js/Express API with PostgreSQL database

Each component has specific setup requirements detailed in the User Manual.

## Getting Started

If you're new to the project, start with the [User Manual](USER_MANUAL.md), which provides comprehensive instructions for setting up both frontend and backend components and deploying the application to Heroku.

If you're familiar with the project and need a quick reference, use the [Quick Setup Guide](QUICK_SETUP_GUIDE.md).

If you encounter issues, refer to the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md) for solutions to common problems.

## System Requirements

- **Node.js**: version 18.x
- **npm**: version 9.x
- **PostgreSQL**: version 14.x or later
- **Git**: latest version
- **Heroku CLI**: latest version (for deployment)

## Contact and Support

If you encounter issues not covered in the documentation, please contact the development team for assistance.
