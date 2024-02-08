#!/bin/bash

set -euo pipefail
set -x

betterstack_url="https://uptime.betterstack.com/ips.txt"
betterstack_file="/tmp/betterstack.txt"

ipv4_output="betterstack/ipv4.txt"
ipv6_output="betterstack/ipv6.txt"

# Fetch IP ranges and save to file
curl -s "$betterstack_url" | grep -v '^#' | cut -d, -f1 > "$betterstack_file"

# Process and save IPv4 and IPv6 to separate files
grep -v ':' "$betterstack_file" | sort -V | uniq > "$ipv4_output"
grep ':' "$betterstack_file" | sort -V | uniq > "$ipv6_output"
