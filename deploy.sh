#!/bin/bash

# Build the project
npm run build

# Create the _redirects file for SPA routing
echo "/*    /index.html   200" > dist/_redirects

# Install netlify-cli if not already installed
npx netlify-cli deploy --prod --dir=dist 