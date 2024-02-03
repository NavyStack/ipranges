#!/bin/bash

set -euo pipefail
set -x

# Define file paths
json_file="/tmp/github.json"
timestamp_file="github/timestamp.txt"

github_all_txt="/tmp/github-all.txt"

github_ipv4_txt="github/ipv4.txt"
github_ipv6_txt="github/ipv6.txt"

# Check if the timestamp_file exists and remove it if it does
if [ -e "$timestamp_file" ]; then
    rm "$timestamp_file"
    echo "Step 0: File $timestamp_file removed successfully."
else
    echo "Step 0: File $timestamp_file does not exist. Skip."
fi

# Step 1: Fetch data from GitHub API with error handling
if curl -s https://api.github.com/meta > "$json_file"; then
    echo "Step 1: Data fetched from GitHub API successfully."
else
    echo "Step 1: Unable to fetch data from GitHub API." >&2
    exit 1
fi

# Step 2: Extract data without specified keys and flatten the structure
filtered_data=$(jq '
  with_entries(
    select(
      .key | . != "ssh_keys" and
      . != "verifiable_password_authentication" and
      . != "ssh_key_fingerprints" and
      . != "domains"
    )
  ) | .[] | .[]
' -r "$json_file")

# Save the filtered data to the github_all_txt file
echo "$filtered_data" > "$github_all_txt"

# Step 3: Save IPv4 addresses
if grep -v ':' "$github_all_txt" | sort -V | uniq > "$github_ipv4_txt"; then
    echo "Step 3: IPv4 addresses saved successfully."
else
    echo "Step 3: Failed to save IPv4 addresses." >&2
    exit 1
fi

# Step 4: Save IPv6 addresses
if grep ':' "$github_all_txt" | sort -V | uniq > "$github_ipv6_txt"; then
    echo "Step 4: IPv6 addresses saved successfully."
else
    echo "Step 3: Failed to save IPv6 addresses." >&2
    exit 1
fi

# Step 5: Save timestamp to the timestamp file
# timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.000000Z")
# echo "$timestamp" > "$timestamp_file"
# echo "Step 5: Timestamp saved successfully."

echo "Github Complete!"