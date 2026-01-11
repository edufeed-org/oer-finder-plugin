#!/bin/sh
#
# Publish Demo Educational Resource Events
#
# This script generates and publishes sample Nostr events to the local Nak relay
# to demonstrate the OER aggregator's event ingestion functionality.
#
# Events published (10 sets):
# - Kind 1063: File Metadata events for educational images about photosynthesis (photosynthesis1.png - photosynthesis10.png)
# - Kind 30142: Learning Resource events with structured educational metadata
#
# Usage:
#   docker compose exec nak-relay /data/publish-demo-events.sh
#
# Or from within the nak-relay container:
#   /data/publish-demo-events.sh
#

set -e

RELAY_URL="ws://localhost:3334"

echo "==> Publishing demo events to local Nak relay at ${RELAY_URL}"
echo ""

EVENT_COUNT=0

# Loop 10 times to publish different images
for i in $(seq 1 2); do
  echo "==> Publishing event set ${i}/2"
  echo ""

  echo "==> Step 1: Publishing kind 1063 file metadata event (image ${i})"
  echo ""

  # Create and publish kind 1063 event (File Metadata)
  # This represents metadata about an educational image file
  KIND_1063_OUTPUT=$(nak event -k 1063 \
    -c "Educational image demonstrating the process of photosynthesis in plant cells" \
    -t "url=https://example.edu/images/photosynthesis${i}.png" \
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

  echo "==> Step 2: Publishing kind 30142 learning resource event (image ${i})"
  echo ""

  # Create and publish kind 30142 event (Learning Resource)
  # This event references the kind 1063 event and adds educational metadata
  # Following the specification at https://github.com/edufeed-org/nips/blob/edufeed-amb/edufeed.md
  KIND_30142_OUTPUT=$(nak event -k 30142 \
    -c "This educational resource provides a detailed visual explanation of photosynthesis, showing how plants convert light energy into chemical energy. Ideal for middle and high school biology students." \
    -t "d=https://example.edu/images/photosynthesis${i}.png" \
    -t "e=${KIND_1063_EVENT_ID};${RELAY_URL};" \
    -t "type=LearningResource" \
    -t "type=Image" \
    -t "name=Photosynthesis Process Diagram ${i}" \
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

  EVENT_COUNT=$((EVENT_COUNT + 2))
done

echo "==> ✓ All demo events published successfully!"
echo ""
echo "Summary: Published ${EVENT_COUNT} events (10 sets of kind 1063 + kind 30142)"
echo ""
echo "These events should now be available for ingestion by the OER aggregator application."
