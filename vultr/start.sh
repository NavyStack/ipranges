#!/bin/bash

# https://docs.vultr.com/vultr-ip-space

set -euo pipefail
set -x

# Define file paths
json_file="/tmp/vultr.json"
# timestamp_file="vultr/timestamp.txt"
combined_file="/tmp/vultr-combined.txt"
ipv4_output="vultr/ipv4.txt"
ipv6_output="vultr/ipv6.txt"

# get from public ranges
if curl -s https://geofeed.constant.com/?json > "$json_file"; then
  echo "Vultr IP ranges fetched successfully."
else
  echo "Error: Failed to fetch Vultr IP ranges." >&2
  exit 1
fi

# Extract "updated" timestamp value
# updated_timestamp=$(jq -r '.updated' "$json_file")

# Save "updated" timestamp value to file
# echo "$updated_timestamp" > "$timestamp_file"

# save ipv4 and ipv6 combined
jq '.subnets[] | select(.ip_prefix != null) | .ip_prefix' -r "$json_file" > "$combined_file"

# separate ipv4 and ipv6
grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+$' "$combined_file" > "$ipv4_output"
grep -E '^[0-9a-fA-F:]+/[0-9]+$' "$combined_file" > "$ipv6_output"

# sort & uniq
if sort -V "$ipv4_output" | uniq > "$ipv4_output.tmp" && mv "$ipv4_output.tmp" "$ipv4_output"; then
  echo "Vultr IPv4 addresses sorted and duplicates removed successfully."
else
  echo "Error: Failed to sort Vultr IPv4 addresses." >&2
  exit 1
fi

if sort -V "$ipv6_output" | uniq > "$ipv6_output.tmp" && mv "$ipv6_output.tmp" "$ipv6_output"; then
  echo "Vultr IPv6 addresses sorted and duplicates removed successfully."
else
  echo "Error: Failed to sort Vultr IPv6 addresses." >&2
  exit 1
fi

# Clean up temporary files
rm "$combined_file"
