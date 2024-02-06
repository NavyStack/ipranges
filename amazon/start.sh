#!/bin/bash

# https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html

set -euo pipefail
set -x

# Define file paths
json_file="/tmp/amazon.json"
timestamp_file="amazon/timestamp.txt"
ipv4_file="/tmp/amazon-ipv4.txt"
ipv6_file="/tmp/amazon-ipv6.txt"
ipv4_output="amazon/ipv4.txt"
ipv6_output="amazon/ipv6.txt"

# get from public ranges
if curl -s https://ip-ranges.amazonaws.com/ip-ranges.json > "$json_file"; then
  echo "AWS IP ranges fetched successfully."
else
  echo "Error: Failed to fetch AWS IP ranges." >&2
  exit 1
fi

# Extract "createDate" value
create_date=$(jq -r '.createDate' "$json_file")

# Save "createDate" value to file
echo "$create_date" > "$timestamp_file"

# save ipv4
if jq '.prefixes[] | [.ip_prefix][] | select(. != null)' -r "$json_file" > "$ipv4_file"; then
  echo "AWS IPv4 addresses saved successfully."
else
  echo "Error: Failed to save AWS IPv4 addresses." >&2
  exit 1
fi

# save ipv6
if jq '.ipv6_prefixes[] | [.ipv6_prefix][] | select(. != null)' -r "$json_file" > "$ipv6_file"; then
  echo "AWS IPv6 addresses saved successfully."
else
  echo "Error: Failed to save AWS IPv6 addresses." >&2
  exit 1
fi

# sort & uniq
if sort -V "$ipv4_file" | uniq > "$ipv4_output"; then
  echo "AWS IPv4 addresses sorted and duplicates removed successfully."
else
  echo "Error: Failed to sort AWS IPv4 addresses." >&2
  exit 1
fi

if sort -V "$ipv6_file" | uniq > "$ipv6_output"; then
  echo "AWS IPv6 addresses sorted and duplicates removed successfully."
else
  echo "Error: Failed to sort AWS IPv6 addresses." >&2
  exit 1
fi
