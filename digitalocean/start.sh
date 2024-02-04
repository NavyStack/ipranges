#!/bin/bash

# https://docs.digitalocean.com/products/platform/
# From: https://github.com/nccgroup/cloud_ip_ranges
# https://github.com/nccgroup/cloud_ip_ranges/blob/24c34811976763b5fa7911ec69b961e671b76e34/cloud_ip_ranges.py#L100

set -euo pipefail
set -x

digitalocean_url="https://www.digitalocean.com/geo/google.csv"
digitalocean_file="/tmp/digitalocean.txt"

ipv4_output="digitalocean/ipv4.txt"
ipv6_output="digitalocean/ipv6.txt"

# Fetch IP ranges and save to file
curl -s "$digitalocean_url" | grep -v '^#' | cut -d, -f1 > "$digitalocean_file"

# Process and save IPv4 and IPv6 to separate files
grep -v ':' "$digitalocean_file" | sort -V | uniq > "$ipv4_output"
grep ':' "$digitalocean_file" | sort -V | uniq > "$ipv6_output"
