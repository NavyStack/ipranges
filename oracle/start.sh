#!/bin/bash

set -euo pipefail
set -x

# Define file paths
json_file="/tmp/oracle.json"
timestamp_file="oracle/timestamp.txt"

ipv4_file="/tmp/oracle-ipv4.txt"
ipv4_output="oracle/ipv4.txt"
ipv4_comma_output="oracle/ipv4_comma.txt"

# ipv6 not provided
# ipv6_file="/tmp/oracle-ipv6.txt"
# ipv6_output="oracle/ipv6.txt"
# ipv6_comma_output="oracle/ipv6_comma.txt"


# Check if the timestamp_file exists and remove it if it does
if [ -e "$timestamp_file" ]; then
    rm "$timestamp_file"
    echo "Step 0: File $timestamp_file removed successfully."
else
    echo "Step 0: File $timestamp_file does not exist. Skip."
fi


# Download public ORACLE IP ranges
if curl -s https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json > "$json_file"; then
    echo "Step 1: Data fetched from ORACLE IP ranges using curl successfully."
else
    echo "Step 1: Failed to download ORACLE IP ranges using curl." >&2
    exit 1
fi

# Extract creationTime from JSON and convert to UTC
timestamp=$(jq -r '.last_updated_timestamp' "$json_file")
oracle_utc=$(date -d "$timestamp" -u +"%Y-%m-%dT%H:%M:%S.000000Z")

# Save timestamp to file
echo "$oracle_utc" > "$timestamp_file"

# Save IPv4 addresses and check if the jq command was successful
if jq '.regions[] | [.cidrs][] | .[].cidr | select(. != null)' -r "$json_file" > "$ipv4_file"; then
    echo "Step 2: IPv4 addresses extracted successfully."
else
    echo "Step 2: Failed to extract IPv4 addresses using jq."
    exit 1
fi

# Sort and remove duplicates for IPv4 and check if the sort command was successful
if sort -V "$ipv4_file" | uniq > "$ipv4_output"; then
    echo "Step 3: IPv4 addresses sorted and duplicates removed successfully."
else
    echo "Step 3: Failed to sort IPv4 addresses."
    exit 1
fi

# Save IPv4 addresses with comma separation and check if the jq and sort commands were successful
if jq -r '.regions[] | [.cidrs][] | .[].cidr | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv4_comma_output"; then
    echo "Step 4: IPv4 addresses processed for comma separation successfully."
else
    echo "Step 4: Failed to process IPv4 addresses for comma separation."
    exit 1
fi

# Clean up temporary files
rm "$json_file" "$ipv4_file"

echo "OCI Complete!"