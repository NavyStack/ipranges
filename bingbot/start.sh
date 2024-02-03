#!/bin/bash

set -euo pipefail
set -x

# Define file paths
json_file="/tmp/bingbot.json"
timestamp_file="bingbot/timestamp.txt"

ipv4_file="/tmp/bingbot-ipv4.txt"
ipv4_comma_output="bingbot/ipv4_comma.txt"
ipv4_output="bingbot/ipv4.txt"

# ipv6 not provided

# Check if the timestamp_file exists and remove it if it does
if [ -e "$timestamp_file" ]; then
    rm "$timestamp_file"
    echo "Step 0: File $timestamp_file removed successfully."
else
    echo "Step 0: File $timestamp_file does not exist. Skip."
fi

# Download public BingBot IP ranges
if curl -s https://www.bing.com/toolbox/bingbot.json > "$json_file"; then
    echo "Step 1: Data fetched from BingBot IP ranges using curl successfully."
else
    echo "Step 1: Failed to download BingBot IP ranges using curl." >&2
    exit 1
fi

# Extract creationTime from JSON and convert to UTC
timestamp=$(jq -r '.creationTime' "$json_file")
bingbot_utc=$(date -d "$timestamp" -u +"%Y-%m-%dT%H:%M:%S.000000Z")

# Save timestamp to file
echo "$bingbot_utc" > "$timestamp_file"

# Save IPv4 addresses and check if the jq command was successful
if jq '.prefixes[] | [.ipv4Prefix][] | select(. != null)' -r "$json_file" > "$ipv4_file"; then
    echo "Step 2: IPv4 addresses extracted successfully."
else
    echo "Step 2: Error: Failed to extract IPv4 addresses using jq."
    exit 1
fi

# Sort and remove duplicates for IPv4 and check if the sort command was successful
if sort -V "$ipv4_file" | uniq > "$ipv4_output"; then
    echo "Step 4: IPv4 addresses sorted and duplicates removed successfully."
else
    echo "Step 4: Error: Failed to sort IPv4 addresses."
    exit 1
fi

# Save IPv4 addresses with comma separation and check if the jq and sort commands were successful
if jq -r '.prefixes[] | [.ipv4Prefix][] | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv4_comma_output"; then
    echo "Step 6: IPv4 addresses processed for comma separation successfully."
else
    echo "Step 6: Failed to process IPv4 addresses for comma separation."
    exit 1
fi

# Clean up temporary files
rm "$json_file" "$ipv4_file"

echo "BingBot Complete!"