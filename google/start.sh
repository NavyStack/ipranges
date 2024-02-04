#!/bin/bash

TMP_DIR="/tmp"

GOOG_URL="https://www.gstatic.com/ipranges/goog.txt"
CLOUD_URL="https://www.gstatic.com/ipranges/cloud.json"
GOOGLEBOT_URL="https://developers.google.com/search/apis/ipranges/googlebot.json"

NETBLOCKS=("dig TXT _netblocks.google.com +short @8.8.8.8"
          "dig TXT _netblocks2.google.com +short @8.8.8.8"
         )

OTHER_NETBLOCKS=("get_dns_spf _cloud-netblocks.googleusercontent.com"
                "get_dns_spf _spf.google.com"
               )

get_dns_spf() {
   dig @8.8.8.8 +short txt "$1" |
   tr ' ' '\n' |
   while read -r entry; do
      case "$entry" in
         ip4:*) echo "${entry#*:}" ;;
         ip6:*) echo "${entry#*:}" ;;
         include:*) get_dns_spf "${entry#*:}" ;;
      esac
   done
}

download_ip_ranges() {
   curl -s "$1" > "$2/$3"
}

download_ip_ranges "$GOOG_URL" "$TMP_DIR" "goog.txt"
download_ip_ranges "$CLOUD_URL" "$TMP_DIR" "cloud.json"
download_ip_ranges "$GOOGLEBOT_URL" "$TMP_DIR" "googlebot.json"

{
  for cmd in "${NETBLOCKS[@]}"; do
     eval "$cmd" | tr '[:space:]+' "\n" | grep ':' | cut -d: -f2- 
  done

  for cmd in "${OTHER_NETBLOCKS[@]}"; do
     eval "$cmd"
  done
} > "$TMP_DIR/netblocks.txt"

{
  grep -v ':' "$TMP_DIR/goog.txt"
  jq '.prefixes[] | [.ipv4Prefix][] | select(. != null)' -r "$TMP_DIR/cloud.json"
  jq '.prefixes[] | [.ipv4Prefix][] | select(. != null)' -r "$TMP_DIR/googlebot.json"
  grep -v ':' "$TMP_DIR/netblocks.txt"
} | sort -V | uniq > "google/ipv4.txt"

{
  grep ':' "$TMP_DIR/goog.txt"
  jq '.prefixes[] | [.ipv6Prefix][] | select(. != null)' -r "$TMP_DIR/cloud.json"
  jq '.prefixes[] | [.ipv6Prefix][] | select(. != null)' -r "$TMP_DIR/googlebot.json"
  grep ':' "$TMP_DIR/netblocks.txt"
} | sort -V | uniq > "google/ipv6.txt"
