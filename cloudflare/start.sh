#!/bin/bash
# https://www.cloudflare.com/ips/

# Define file paths
timestamp_file="cloudflare/timestamp.txt"

ipv4_file="/tmp/cf-ipv4.txt"
ipv4_output="cloudflare/ipv4.txt"

ipv6_file="/tmp/cf-ipv6.txt"
ipv6_output="cloudflare/ipv6.txt"

# Check if the timestamp_file exists and remove it if it does
if [ -e "$timestamp_file" ]; then
  rm "$timestamp_file"
  echo "Step 0: File $timestamp_file removed successfully."
else
  echo "Step 0: File $timestamp_file does not exist. Skip."
fi

# get from public ranges
if curl -s https://www.cloudflare.com/ips-v4/ > "$ipv4_file"; then
  echo "IPv4 addresses fetched successfully."
else
  echo "Error: Failed to fetch IPv4 addresses." >&2
  exit 1
fi

if curl -s https://www.cloudflare.com/ips-v6/ > "$ipv6_file"; then
  echo "IPv6 addresses fetched successfully."
else
  echo "Error: Failed to fetch IPv6 addresses." >&2
  exit 1
fi

# sort & uniq
if sort -V "$ipv4_file" | uniq > "$ipv4_output"; then
  echo "IPv4 addresses sorted and duplicates removed successfully."
else
  echo "Error: Failed to sort IPv4 addresses." >&2
  exit 1
fi

if sort -V "$ipv6_file" | uniq > "$ipv6_output"; then
  echo "IPv6 addresses sorted and duplicates removed successfully."
else
  echo "Error: Failed to sort IPv6 addresses." >&2
  exit 1
fi

# Step 5: Save timestamp to the timestamp file
# timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000000Z")
# echo "$timestamp" > "$timestamp_file"
# echo "Step 5: Timestamp saved successfully."

echo "Cloudflare Complete!"
