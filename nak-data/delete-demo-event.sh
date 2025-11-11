#!/bin/sh
#
# Delete Demo Educational Resource Event
#
# This script deletes the kind 30142 Learning Resource event published by
# publish-demo-events.sh by creating and publishing a kind 5 deletion event.
#
# Usage:
#   docker compose exec nak-relay /data/delete-demo-event.sh
#
# Or from within the nak-relay container:
#   /data/delete-demo-event.sh
#

set -e

RELAY_URL="ws://127.0.0.1:10547"

echo "==> Deleting kind 30142 demo event from local Nak relay at ${RELAY_URL}"
echo ""

echo "==> Step 1: Fetching kind 30142 event to get its ID"
echo ""

# Query for kind 30142 events
# The 'd' tag should be "https://example.edu/images/photosynthesis5.png"
EVENT_JSON=$(nak req -k 30142 --limit 1 "${RELAY_URL}" 2>/dev/null | head -1)

if [ -z "${EVENT_JSON}" ]; then
  echo "ERROR: No kind 30142 event found to delete"
  exit 1
fi

# Extract event ID from the JSON
EVENT_ID=$(echo "${EVENT_JSON}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "${EVENT_ID}" ]; then
  echo "ERROR: Failed to extract event ID from query result"
  echo "Query result: ${EVENT_JSON}"
  exit 1
fi

echo "✓ Found kind 30142 event"
echo "  Event ID: ${EVENT_ID}"
echo ""

echo "==> Step 2: Publishing kind 5 deletion event"
echo ""

# Create and publish kind 5 event (Deletion)
# This requests deletion of the kind 30142 event
DELETE_OUTPUT=$(nak event -k 5 \
  -c "Removing demo educational resource event" \
  -t "e=${EVENT_ID}" \
  "${RELAY_URL}")

# Extract deletion event ID
DELETE_EVENT_ID=$(echo "${DELETE_OUTPUT}" | awk -F'"id":"' '{print $2}' | awk -F'"' '{print $1}')

if [ -z "${DELETE_EVENT_ID}" ]; then
  echo "ERROR: Failed to publish kind 5 deletion event"
  echo "Output: ${DELETE_OUTPUT}"
  exit 1
fi

echo "✓ Published kind 5 deletion event"
echo "  Deletion Event ID: ${DELETE_EVENT_ID}"
echo "  Target Event ID: ${EVENT_ID}"
echo ""

echo "==> ✓ Deletion request published successfully!"
echo ""
echo "Note: The relay will process this deletion request according to NIP-09."
echo "The aggregator should handle this event and mark the resource as deleted."
echo ""
