#!/bin/sh
#
# Publish Demo Educational Resource Events
#
# This script generates and publishes sample Nostr events to the local Nak relay
# to demonstrate the OER aggregator's event ingestion functionality.
#
# Events published:
# - Kind 1063: File Metadata event for an educational image about photosynthesis
# - Kind 30142: Learning Resource event with structured educational metadata
#
# Usage:
#   docker compose exec nak-relay /data/publish-demo-events.sh
#
# Or from within the nak-relay container:
#   /data/publish-demo-events.sh
#

set -e

RELAY_URL="ws://127.0.0.1:10547"

echo "==> Publishing demo events to local Nak relay at ${RELAY_URL}"
echo ""

echo "==> Step 1: Publishing kind 1063 file metadata event"
echo ""

# Create and publish kind 1063 event (File Metadata)
# This represents metadata about an educational image file
KIND_1063_OUTPUT=$(nak event -k 1063 \
  -c "Educational image demonstrating the process of photosynthesis in plant cells" \
  -t "url=https://example.edu/images/photosynthesis5.png" \
  -t "m=image/png" \
  -t "x=d3b07384d113edec49eaa6238ad5ff00" \
  -t "size=245680" \
  -t "dim=1920x1080" \
  -t "alt=Diagram showing photosynthesis process with labeled chloroplasts, sunlight, water, and CO2" \
  "${RELAY_URL}")

# Extract event ID from the output (nak outputs: "sent event <event-id> to <relay>")
KIND_1063_EVENT_ID=$(echo "${KIND_1063_OUTPUT}" | awk -F'"id":"' '{print $2}' | awk -F'"' '{print $1}')

if [ -z "${KIND_1063_EVENT_ID}" ]; then
  echo "ERROR: Failed to publish kind 1063 event or extract event ID"
  echo "Output: ${KIND_1063_OUTPUT}"
  exit 1
fi

echo "✓ Published kind 1063 event"
echo "  Event ID: ${KIND_1063_EVENT_ID}"
echo ""

echo "==> Step 2: Publishing kind 30142 learning resource event"
echo ""

# Create and publish kind 30142 event (Learning Resource)
# This event references the kind 1063 event and adds educational metadata
# Following the specification at https://github.com/edufeed-org/nips/blob/edufeed-amb/edufeed.md
KIND_30142_OUTPUT=$(nak event -k 30142 \
  -c "This educational resource provides a detailed visual explanation of photosynthesis, showing how plants convert light energy into chemical energy. Ideal for middle and high school biology students." \
  -t "d=https://example.edu/images/photosynthesis5.png" \
  -t "e=${KIND_1063_EVENT_ID}:${RELAY_URL}:file" \
  -t "type=LearningResource" \
  -t "type=Image" \
  -t "name=Photosynthesis Process Diagram" \
  -t "description=Detailed diagram illustrating the photosynthesis process in plant cells" \
  -t "dateCreated=2025-01-15" \
  -t "datePublished=2025-01-20" \
  -t "learningResourceType:id=http://w3id.org/kim/hcrt/image" \
  -t "learningResourceType:prefLabel@en=Image" \
  -t "learningResourceType:prefLabel@de=Bild" \
  -t "license:id=https://creativecommons.org/licenses/by-sa/4.0/" \
  -t "isAccessibleForFree=true" \
  -t "inLanguage=en" \
  -t "audience:id=http://purl.org/dcx/lrmi-vocabs/educationalAudienceRole/student" \
  -t "educationalLevel:id=http://purl.org/dcx/lrmi-vocabs/educationalLevel/middleSchool" \
  -t "teaches:id=http://example.org/concepts/photosynthesis" \
  -t "t=photosynthesis" \
  -t "t=biology" \
  -t "t=plants" \
  -t "t=plant-science" \
  -t "creator:name=Demo Educational Publisher" \
  -t "creator:affiliation:name=Example University" \
  "${RELAY_URL}")

# Extract event ID
KIND_30142_EVENT_ID=$(echo "${KIND_30142_OUTPUT}" | awk -F'"id":"' '{print $2}' | awk -F'"' '{print $1}')

if [ -z "${KIND_30142_EVENT_ID}" ]; then
  echo "ERROR: Failed to publish kind 30142 event or extract event ID"
  echo "Output: ${KIND_30142_OUTPUT}"
  exit 1
fi

echo "✓ Published kind 30142 event"
echo "  Event ID: ${KIND_30142_EVENT_ID}"
echo ""

echo "==> ✓ Demo events published successfully!"
echo ""
echo "Summary:"
echo "  - Kind 1063 (File Metadata): ${KIND_1063_EVENT_ID}"
echo "  - Kind 30142 (Learning Resource): ${KIND_30142_EVENT_ID}"
echo ""
echo "These events should now be available for ingestion by the OER aggregator application."
