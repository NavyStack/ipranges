#!/bin/bash

# https://azure.microsoft.com/en-us/updates/service-tag-discovery-api-in-preview/
# https://docs.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide
# From: https://github.com/jensihnow/AzurePublicIPAddressRanges/blob/main/.github/workflows/main.yml

set -euo pipefail
set -x

timestamp_file="microsoft-azure/timestamp.txt"

# Check if the timestamp_file exists and remove it if it does
if [ -e "$timestamp_file" ]; then
  rm "$timestamp_file"
  echo "Step 0: File $timestamp_file removed successfully."
else
  echo "Step 0: File $timestamp_file does not exist. Skip."
fi

# Function to download and parse Microsoft IP ranges for a given region in the background
download_and_parse_background() {
  local REGION_ID="$1"
  local REGION_NAME="$2"
  local OUTPUT_DIR="microsoft-azure/${REGION_NAME}"

  # Create output directory if not exists
  mkdir -p "${OUTPUT_DIR}"

  # Download Microsoft IP ranges JSON
  URL="$(curl -s https://www.microsoft.com/en-us/download/confirmation.aspx?id="${REGION_ID}" | grep -o '<a href=['"'"'"][^"'"'"']*['"'"'"]' | grep ServiceTags_ | head -1 | sed -e 's/^<a href=["'"'"']//' -e 's/["'"'"']$//')"

  # Extract timestamp from URL (assuming the timestamp is in the URL)
  TIMESTAMP=$(echo "${URL}" | grep -oP '\d{8}' | head -1)

  curl --connect-timeout 60 --retry 3 --retry-delay 15 -s "${URL}" > "/tmp/microsoft_${REGION_NAME}.json"

  # Parse and save IPv4 addresses
  jq '.values[] | [.properties] | .[].addressPrefixes[] | select(. != null)' -r "/tmp/microsoft_${REGION_NAME}.json" | grep -v ':' | sort -V | uniq > "${OUTPUT_DIR}/ipv4.txt"

  # Parse and save IPv6 addresses
  jq '.values[] | [.properties] | .[].addressPrefixes[] | select(. != null)' -r "/tmp/microsoft_${REGION_NAME}.json" | grep ':' | sort -V | uniq > "${OUTPUT_DIR}/ipv6.txt"

  # Save timestamp to the directory
  echo "${TIMESTAMP}" > "${OUTPUT_DIR}/timestamp.txt"
}

# Function to create consolidated files for all regions
consolidate_files() {
  local OUTPUT_DIR="microsoft-azure"

  # Concatenate all IPv4 and IPv6 addresses
  cat "${OUTPUT_DIR}"/*/ipv4.txt > "${OUTPUT_DIR}/all_ipv4.txt"
  cat "${OUTPUT_DIR}"/*/ipv6.txt > "${OUTPUT_DIR}/all_ipv6.txt"
}

# Download and parse IP ranges for each region in parallel
download_and_parse_background "56519" "public-cloud"
download_and_parse_background "57063" "us-gov"
download_and_parse_background "57064" "germany"
download_and_parse_background "57062" "china"

# Wait for all background processes to finish
wait

# Consolidate files for all regions
consolidate_files

echo "Azure Complete!"
