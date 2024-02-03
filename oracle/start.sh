#!/bin/bash

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


# Check if timestamp file exists and remove it
if [ -e "$timestamp_file" ]; then
    rm "$timestamp_file"
fi

# Download public ORACLE IP ranges
curl -s https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json > "$json_file"

# Check if the curl command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to download ORACLE IP ranges using curl."
    exit 1
fi

# Extract creationTime from JSON and convert to UTC
timestamp=$(jq -r '.last_updated_timestamp' "$json_file")
oracle_utc=$(date -d "$timestamp" -u +"%Y-%m-%dT%H:%M:%S.000000Z")

# Save timestamp to file
echo "$oracle_utc" > "$timestamp_file"

# Save IPv4 addresses
jq '.regions[] | [.cidrs][] | .[].cidr | select(. != null)' -r "$json_file" > "$ipv4_file"

# Check if the jq command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to extract IPv4 addresses using jq."
    exit 1
fi

# Sort and remove duplicates for IPv4
sort -V "$ipv4_file" | uniq > "$ipv4_output"

# Check if the sort command was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to sort IPv4 addresses."
    exit 1
fi

# Save IPv4 addresses with comma separation
jq -r '.regions[] | [.cidrs][] | .[].cidr | select(. != null)' "$json_file" | sort -V | uniq | paste -sd "," - > "$ipv4_comma_output"

# Check if the jq and sort commands were successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to process IPv4 addresses for comma separation."
    exit 1
fi

# Clean up temporary files
rm "$json_file" "$ipv4_file"
