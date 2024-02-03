#!/bin/bash

# Define file paths
json_file="/tmp/googlebot.json"
ipv4_file="/tmp/googlebot-ipv4.txt"
ipv6_file="/tmp/googlebot-ipv6.txt"
ipv4_output="googlebot/ipv4.txt"
ipv6_output="googlebot/ipv6.txt"
ipv4_comma_output="googlebot/ipv4_comma.txt"
ipv6_comma_output="googlebot/ipv6_comma.txt"
timestamp_file="googlebot/timestamp.txt"

# Remove existing timestamp file
rm -f "$timestamp_file"

# Download public GoogleBot IP ranges
curl -s https://developers.google.com/search/apis/ipranges/googlebot.json > "$json_file"

# Check if the curl command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to download GoogleBot IP ranges using curl."
    exit 1
fi

# Extract creationTime from JSON and convert to UTC
timestamp=$(jq -r '.creationTime' "$json_file")
googlebot_utc=$(date -d "$timestamp" -u +"%Y-%m-%dT%H:%M:%S.000000Z")

# Save timestamp to file
echo "$googlebot_utc" > "$timestamp_file"

# Save IPv4 addresses
jq '.prefixes[] | [.ipv4Prefix][] | select(. != null)' -r "$json_file" > "$ipv4_file"

# Check if the jq command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to extract IPv4 addresses using jq."
    exit 1
fi

# Save IPv6 addresses
jq '.prefixes[] | [.ipv6Prefix][] | select(. != null)' -r "$json_file" > "$ipv6_file"

# Check if the jq command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to extract IPv6 addresses using jq."
    exit 1
fi

# Sort and remove duplicates for IPv4
sort -V "$ipv4_file" | uniq > "$ipv4_output"

# Check if the sort command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to sort IPv4 addresses."
    exit 1
fi

# Sort and remove duplicates for IPv6
sort -V "$ipv6_file" | uniq > "$ipv6_output"

# Check if the sort command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to sort IPv6 addresses."
    exit 1
fi

# Save IPv4 addresses with comma separation
jq -r '.prefixes[] | [.ipv4Prefix][] | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv4_comma_output"

# Check if the jq and sort commands were successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to process IPv4 addresses for comma separation."
    exit 1
fi

# Save IPv6 addresses with comma separation
jq -r '.prefixes[] | [.ipv6Prefix][] | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv6_comma_output"

# Check if the jq and sort commands were successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to process IPv6 addresses for comma separation."
    exit 1
fi

# Clean up temporary files
rm "$json_file" "$ipv4_file" "$ipv6_file"
