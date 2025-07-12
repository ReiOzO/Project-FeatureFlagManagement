#!/bin/bash

# AWS AppConfig Deployment Script
# This script creates AWS AppConfig application, environment, and configuration profile

set -e

# Configuration
APPLICATION_NAME="MyFeatureFlagApp"
ENVIRONMENT_NAME="production"
PROFILE_NAME="FeatureFlagDemo"
REGION="us-east-1"

echo "🚀 Starting AWS AppConfig deployment..."

# Create AppConfig Application
echo "📋 Creating AppConfig Application..."
aws appconfig create-application \
    --name "$APPLICATION_NAME" \
    --description "Feature Flag Management Application" \
    --region "$REGION" \
    --output table || echo "⚠️ Application may already exist"

# Get Application ID
APPLICATION_ID=$(aws appconfig list-applications \
    --region "$REGION" \
    --query "Items[?Name=='$APPLICATION_NAME'].Id" \
    --output text)

echo "✅ Application ID: $APPLICATION_ID"

# Create Environment
echo "🌍 Creating Environment..."
aws appconfig create-environment \
    --application-id "$APPLICATION_ID" \
    --name "$ENVIRONMENT_NAME" \
    --description "Production environment for feature flags" \
    --region "$REGION" \
    --output table || echo "⚠️ Environment may already exist"

# Get Environment ID
ENVIRONMENT_ID=$(aws appconfig list-environments \
    --application-id "$APPLICATION_ID" \
    --region "$REGION" \
    --query "Items[?Name=='$ENVIRONMENT_NAME'].Id" \
    --output text)

echo "✅ Environment ID: $ENVIRONMENT_ID"

# Create Configuration Profile
echo "📝 Creating Configuration Profile..."
aws appconfig create-configuration-profile \
    --application-id "$APPLICATION_ID" \
    --name "$PROFILE_NAME" \
    --description "Feature flags configuration profile" \
    --location-uri "hosted" \
    --type "AWS.AppConfig.FeatureFlags" \
    --region "$REGION" \
    --output table || echo "⚠️ Configuration Profile may already exist"

# Get Configuration Profile ID
PROFILE_ID=$(aws appconfig list-configuration-profiles \
    --application-id "$APPLICATION_ID" \
    --region "$REGION" \
    --query "Items[?Name=='$PROFILE_NAME'].Id" \
    --output text)

echo "✅ Configuration Profile ID: $PROFILE_ID"

# Create initial configuration version
echo "📄 Creating initial configuration version..."
aws appconfig create-hosted-configuration-version \
    --application-id "$APPLICATION_ID" \
    --configuration-profile-id "$PROFILE_ID" \
    --description "Initial feature flags configuration" \
    --content-type "application/json" \
    --content fileb://appconfig/feature-flags.json \
    --region "$REGION" \
    --output table

echo "✅ Initial configuration created"

# Create deployment strategy
echo "🎯 Creating deployment strategy..."
aws appconfig create-deployment-strategy \
    --name "FeatureFlag.Linear10PercentEvery1Minute" \
    --description "Linear deployment strategy for feature flags" \
    --deployment-duration-in-minutes 10 \
    --growth-factor 10 \
    --growth-type LINEAR \
    --final-bake-time-in-minutes 5 \
    --replicate-to NONE \
    --region "$REGION" \
    --output table || echo "⚠️ Deployment strategy may already exist"

echo "🎉 AWS AppConfig deployment completed!"
echo ""
echo "📋 Summary:"
echo "  Application: $APPLICATION_NAME (ID: $APPLICATION_ID)"
echo "  Environment: $ENVIRONMENT_NAME (ID: $ENVIRONMENT_ID)"
echo "  Profile: $PROFILE_NAME (ID: $PROFILE_ID)"
echo "  Region: $REGION"
echo ""
echo "🔧 Update your .env file with these values:"
echo "  APPCONFIG_APPLICATION=$APPLICATION_NAME"
echo "  APPCONFIG_ENVIRONMENT=$ENVIRONMENT_NAME"
echo "  APPCONFIG_PROFILE=$PROFILE_NAME"
echo "  AWS_REGION=$REGION" 