#!/bin/bash

# Start: Remove this if you want successful alerts
if [[ $CODEBUILD_BUILD_SUCCEEDING == "1" ]]; then
  exit 0
fi
# End: Remove this if you want successful alerts

ACCOUNT_ID=$(echo "$CODEBUILD_BUILD_ARN" | cut -d ':' -f 5)
PROJECT_NAME=$(echo "$CODEBUILD_BUILD_ID" | cut -d ':' -f 1)

ACTION=$(echo "$PROJECT_NAME" | rev | cut -d '-' -f 1 | rev)

RESULT=succeeded
COLOR=3669879
if [[ $CODEBUILD_BUILD_SUCCEEDING == "0" ]]; then
  RESULT=failed
  COLOR=16712294
fi

CODEBUILD_URL="https://${AWS_REGION}.console.aws.amazon.com/codesuite/codebuild/${ACCOUNT_ID}/projects/${PROJECT_NAME}/build/$CODEBUILD_BUILD_ID/?region=${AWS_REGION}"

CODEBUILD_START_TIME_S=$((CODEBUILD_START_TIME / 1000))
START_TIME=$(date -d "@${CODEBUILD_START_TIME_S}" +"%b %d, %Y %I:%M %p %z")

DATA=$(cat << EOF
{
  "username": "[${ENVIRONMENT^^}] ${ACTION^} ${RESULT}",
  "embeds": [
    {
      "title": "Build Logs",
      "url": "${CODEBUILD_URL}",
      "color": $COLOR,
      "fields": [
        {
          "name": "Project",
          "value": "${PROJECT_NAME}"
        },
        {
          "name": "Build Number",
          "value": "${CODEBUILD_BUILD_NUMBER}"
        },
        {
          "name": "Triggered By",
          "value": "${CODEBUILD_WEBHOOK_TRIGGER}",
          "inline": true
        },
        {
          "name": "Start Time",
          "value": "${START_TIME}"
        },
        {
          "name": "Repo URL",
          "value": "${CODEBUILD_SOURCE_REPO_URL}"
        },
        {
          "name": "Commit Hash",
          "value": "${CODEBUILD_RESOLVED_SOURCE_VERSION}"
        }
      ]
    }
  ]
}
EOF
)

curl --location $DISCORD_URL \
--header 'Content-Type: application/json' \
--data "$DATA"
