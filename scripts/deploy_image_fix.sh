#!/bin/bash

# Shell script wrapper to execute Node.js deployment script
node "$(dirname "$0")/heroku_deploy_product_image_fix.js"
