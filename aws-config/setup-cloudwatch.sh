#!/bin/bash

# CloudWatch Setup Script
# This script creates CloudWatch dashboard and alarms for Feature Flag Management

set -e

# Configuration
DASHBOARD_NAME="FeatureFlags-Dashboard"
REGION="us-east-1"
SNS_TOPIC_NAME="feature-flag-alerts"

echo "🚀 Starting CloudWatch setup..."

# Create SNS topic for alerts
echo "📢 Creating SNS topic..."
SNS_TOPIC_ARN=$(aws sns create-topic \
    --name "$SNS_TOPIC_NAME" \
    --region "$REGION" \
    --query 'TopicArn' \
    --output text)

echo "✅ SNS Topic created: $SNS_TOPIC_ARN"

# Create CloudWatch dashboard
echo "📊 Creating CloudWatch dashboard..."
aws cloudwatch put-dashboard \
    --dashboard-name "$DASHBOARD_NAME" \
    --dashboard-body file://cloudwatch/dashboard.json \
    --region "$REGION"

echo "✅ CloudWatch dashboard created: $DASHBOARD_NAME"

# Create alarms for automated rollback
echo "🚨 Creating CloudWatch alarms..."

# High error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "FeatureFlags-HighErrorRate" \
    --alarm-description "Alarm when error rate exceeds 5%" \
    --metric-name "ErrorRate" \
    --namespace "FeatureFlags" \
    --statistic "Average" \
    --period 300 \
    --threshold 5 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --region "$REGION"

# High response time alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "FeatureFlags-HighResponseTime" \
    --alarm-description "Alarm when response time exceeds 5 seconds" \
    --metric-name "ResponseTime" \
    --namespace "FeatureFlags" \
    --statistic "Average" \
    --period 300 \
    --threshold 5000 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --region "$REGION"

# High memory usage alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "FeatureFlags-HighMemoryUsage" \
    --alarm-description "Alarm when memory usage exceeds 80%" \
    --metric-name "MemoryUsage" \
    --namespace "FeatureFlags" \
    --statistic "Average" \
    --period 300 \
    --threshold 80 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 3 \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --region "$REGION"

# Feature flag specific alarms
echo "🔧 Creating feature flag specific alarms..."

# Enhanced search error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "FeatureFlag-enhanced-search-ErrorRate" \
    --alarm-description "Alarm for enhanced-search feature flag error rate" \
    --metric-name "ErrorRate" \
    --namespace "FeatureFlags" \
    --statistic "Average" \
    --period 300 \
    --threshold 3 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --dimensions "Name=FeatureFlagName,Value=enhanced-search" \
    --region "$REGION"

# Premium features error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "FeatureFlag-premium-features-ErrorRate" \
    --alarm-description "Alarm for premium-features feature flag error rate" \
    --metric-name "ErrorRate" \
    --namespace "FeatureFlags" \
    --statistic "Average" \
    --period 300 \
    --threshold 3 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --dimensions "Name=FeatureFlagName,Value=premium-features" \
    --region "$REGION"

# Create composite alarm for overall system health
echo "🔍 Creating composite alarm..."
aws cloudwatch put-composite-alarm \
    --alarm-name "FeatureFlags-SystemHealth" \
    --alarm-description "Composite alarm for overall system health" \
    --alarm-rule "(ALARM(FeatureFlags-HighErrorRate) OR ALARM(FeatureFlags-HighResponseTime) OR ALARM(FeatureFlags-HighMemoryUsage))" \
    --actions-enabled \
    --alarm-actions "$SNS_TOPIC_ARN" \
    --region "$REGION"

echo "✅ CloudWatch alarms created"

# Create log group for Lambda function
echo "📝 Creating log group..."
aws logs create-log-group \
    --log-group-name "/aws/lambda/feature-flag-rollback" \
    --region "$REGION" || echo "⚠️ Log group may already exist"

# Create log retention policy
aws logs put-retention-policy \
    --log-group-name "/aws/lambda/feature-flag-rollback" \
    --retention-in-days 30 \
    --region "$REGION" || echo "⚠️ Could not set retention policy"

echo "✅ Log group created"

echo "🎉 CloudWatch setup completed!"
echo ""
echo "📋 Summary:"
echo "  Dashboard: $DASHBOARD_NAME"
echo "  SNS Topic: $SNS_TOPIC_ARN"
echo "  Region: $REGION"
echo "  Alarms created:"
echo "    - FeatureFlags-HighErrorRate"
echo "    - FeatureFlags-HighResponseTime"  
echo "    - FeatureFlags-HighMemoryUsage"
echo "    - FeatureFlag-enhanced-search-ErrorRate"
echo "    - FeatureFlag-premium-features-ErrorRate"
echo "    - FeatureFlags-SystemHealth (composite)"
echo ""
echo "🔗 View dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
echo ""
echo "🔧 Next steps:"
echo "  1. Subscribe to SNS topic for alerts"
echo "  2. Deploy Lambda function for automated rollback"
echo "  3. Test alarm thresholds" 