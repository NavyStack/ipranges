#!/bin/bash

set -euo pipefail
set -x

# Define file paths
json_file="/tmp/googlebot.json"
timestamp_file="googlebot/timestamp.txt"

ipv4_file="/tmp/googlebot-ipv4.txt"
ipv4_comma_output="googlebot/ipv4_comma.txt"
ipv4_output="googlebot/ipv4.txt"

ipv6_file="/tmp/googlebot-ipv6.txt"
ipv6_output="googlebot/ipv6.txt"
ipv6_comma_output="googlebot/ipv6_comma.txt"

# Check if the timestamp_file exists and remove it if it does
if [ -e "$timestamp_file" ]; then
    rm "$timestamp_file"
    echo "Step 0: File $timestamp_file removed successfully."
else
    echo "Step 0: File $timestamp_file does not exist. Skip."
fi

# Download public GoogleBot IP ranges
if curl -s https://developers.google.com/search/apis/ipranges/googlebot.json > "$json_file"; then
    echo "Step 1: Data fetched from GoogleBot IP ranges using curl successfully."
else
    echo "Step 1: Failed to download ORACLE IP ranges using curl." >&2
    exit 1
fi

# Extract creationTime from JSON and convert to UTC
timestamp=$(jq -r '.creationTime' "$json_file")
googlebot_utc=$(date -d "$timestamp" -u +"%Y-%m-%dT%H:%M:%S.000000Z")

# Save timestamp to file
echo "$googlebot_utc" > "$timestamp_file"

# Save IPv4 addresses and check if the jq command was successful
if jq '.prefixes[] | [.ipv4Prefix][] | select(. != null)' -r "$json_file" > "$ipv4_file"; then
    echo "Step 2: IPv4 addresses extracted successfully."
else
    echo "Step 2: Error: Failed to extract IPv4 addresses using jq."
    exit 1
fi

# Save IPv6 addresses and check if the jq command was successful
if jq '.prefixes[] | [.ipv6Prefix][] | select(. != null)' -r "$json_file" > "$ipv6_file"; then
    echo "Step 3: IPv6 addresses extracted successfully."
else
    echo "Step 3: Error: Failed to extract IPv6 addresses using jq."
    exit 1
fi

# Sort and remove duplicates for IPv4 and check if the sort command was successful
if sort -V "$ipv4_file" | uniq > "$ipv4_output"; then
    echo "Step 4: IPv4 addresses sorted and duplicates removed successfully."
else
    echo "Step 4: Error: Failed to sort IPv4 addresses."
    exit 1
fi

# Sort and remove duplicates for IPv6 and check if the sort command was successful
if sort -V "$ipv6_file" | uniq > "$ipv6_output"; then
    echo "Step 5: IPv6 addresses sorted and duplicates removed successfully."
else
    echo "Step 5: Error: Failed to sort IPv6 addresses."
    exit 1
fi

# Save IPv4 addresses with comma separation and check if the jq and sort commands were successful
if jq -r '.prefixes[] | [.ipv4Prefix][] | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv4_comma_output"; then
    echo "Step 6: IPv4 addresses processed for comma separation successfully."
else
    echo "Step 6: Failed to process IPv4 addresses for comma separation."
    exit 1
fi

# Save IPv6 addresses with comma separation and check if the jq and sort commands were successful
if jq -r '.prefixes[] | [.ipv6Prefix][] | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv6_comma_output"; then
    echo "Step 7: IPv6 addresses processed for comma separation successfully."
else
    echo "Step 7: Error: Failed to process IPv6 addresses for comma separation."
    exit 1
fi

# Clean up temporary files
rm "$json_file" "$ipv4_file" "$ipv6_file"

echo "Googlebot Complete!"