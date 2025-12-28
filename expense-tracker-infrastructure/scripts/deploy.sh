#!/bin/bash

echo "Building backend..."
cd ../expense-tracker-backend
npm install
npm run build

echo "Deploying infrastructure..."
cd ../expense-tracker-infrastructure
sam build
sam deploy --guided

echo "Deployment complete!"
