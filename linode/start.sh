#!/bin/bash

set -euo pipefail
set -x

linode_url="https://geoip.linode.com/"
linode_file="/tmp/linode.txt"
# timestamp_file="linode/timestamp.txt"

# Fetch IP ranges and save to file
curl -s "$linode_url" | grep -v '^#' | cut -d, -f1 > "$linode_file"

# Save timestamp to file
# grep '^# Last modified:' <(curl -s "$linode_url") | cut -d' ' -f4- > "$timestamp_file"

# Process and save IPv4 and IPv6 to separate files
grep -v ':' "$linode_file" | sort -V | uniq > "linode/ipv4.txt"
grep ':' "$linode_file" | sort -V | uniq > "linode/ipv6.txt"
