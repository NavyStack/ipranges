# ipranges

## Important Note:

> [!CAUTION]
> All IP lists utilized by this script are sourced from public sources.

> [!TIP]
> Contributions or suggestions for improvement are warmly welcomed!

---

> [!IMPORTANT]
> All other trademarks are the property of their respective owners, and unless otherwise stated, we do not claim any affiliation, endorsement, or association with the owners or entities of the mentioned trademarks.

---

## Askfront.com

초보자도 자유롭게 질문할 수 있는 포럼을 만들었습니다. <br />
NavyStack의 가이드 뿐만 아니라, 아니라 모든 종류의 질문을 하실 수 있습니다.

검색해도 도움이 되지 않는 정보만 나오는 것 같고, 주화입마에 빠진 것 같은 기분이 들 때가 있습니다.<br />
그럴 때, 부담 없이 질문해 주세요. 같이 의논하며 생각해봅시다.

[AskFront.com (에스크프론트) 포럼](https://askfront.com/?github)

## IP Address List Merger

This script simplifies the organization of publicly available IP addresses gathered from various sources, consolidating and refining IP address ranges from specified text files. It creates an organized list in a clean format. Supported file extensions include .txt, and the resulting files are suffixed with `\_mini` or `\_comma` .

## How to Use:

0. Simply use text files and links in this repositry
1. Customize the filesToProcess array with the names of the files you want to process.
2. Save your IP address lists in text files (.txt).
3. Execute the script to recursively search for the specified files in the current directory and its subdirectories.

```bash
"build-m": "tsx src/compress.ts -m ipv4.txt ipv6.txt"
```

```bash
"build-c": "tsx src/compress.ts -c ipv4.txt ipv6.txt"
```

4. The merged IP address lists will be saved in new files with the designated `\_mini` or `\_comma` suffix.

## Amazon

```md
amazon
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
├── ipv6_mini.txt
└── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/amazon/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/amazon/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/amazon/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/amazon/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/amazon/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/amazon/ipv6_comma.txt
```

## Bingbot

```md
bingbot
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
└── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/bingbot/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/bingbot/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/bingbot/ipv4_comma.txt
```

## Cloudflare

```md
cloudflare
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
├── ipv6_mini.txt
└── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/cloudflare/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/cloudflare/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/cloudflare/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/cloudflare/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/cloudflare/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/cloudflare/ipv6_comma.txt
```

## Digitalocean

```md
digitalocean
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
└── ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/digitalocean/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/digitalocean/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/digitalocean/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/digitalocean/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/digitalocean/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/digitalocean/ipv6_comma.txt
```

## Github

```md
github
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
├── ipv6_mini.txt
├── timestamp.txt
├── actions
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── actions_macos
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ └── ipv4_mini.txt
├── api
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── copilot
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── dependabot
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ └── ipv4_mini.txt
├── git
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── github_enterprise_importer
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── hooks
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── importer
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ └── ipv4_mini.txt
├── packages
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ └── ipv4_mini.txt
├── pages
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
└── web
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
└── ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/github/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/github/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/github/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/github/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/github/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/github/ipv6_comma.txt
```

## Googlebot

```md
googlebot
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
└── ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/googlebot/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/googlebot/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/googlebot/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/googlebot/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/googlebot/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/googlebot/ipv6_comma.txt
```

## Google + Googlebot

```md
google
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
├── ipv6_mini.txt
├── cloud
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
├── goog
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ └── ipv6_mini.txt
└── googlebot
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
└── ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/google/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/google/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/google/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/google/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/google/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/google/ipv6_comma.txt
```

## Linode

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/linode/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/linode/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/linode/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/linode/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/linode/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/linode/ipv6_comma.txt
```

## Microsoft-Azure (ALL)

```md
microsoft-azure
├── all_ipv4.txt
├── all_ipv4_comma.txt
├── all_ipv4_mini.txt
├── all_ipv6.txt
├── all_ipv6_comma.txt
├── all_ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/all_ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/all_ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/all_ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/all_ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/all_ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/all_ipv6_comma.txt
```

## Microsoft-Azure (China)

```md
china
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ ├── ipv6_mini.txt
│ └── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/china/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/china/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/china/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/china/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/china/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/china/ipv6_comma.txt
```

## Microsoft-Azure (Germany)

```md
germany
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ ├── ipv6_mini.txt
│ └── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/germany/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/germany/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/germany/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/germany/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/germany/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/germany/ipv6_comma.txt
```

## Microsoft-Azure (Public Cloud Only)

```md
public-cloud
│ ├── ipv4.txt
│ ├── ipv4_comma.txt
│ ├── ipv4_mini.txt
│ ├── ipv6.txt
│ ├── ipv6_comma.txt
│ ├── ipv6_mini.txt
│ └── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/public-cloud/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/public-cloud/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/public-cloud/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/public-cloud/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/public-cloud/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/public-cloud/ipv6_comma.txt
```

## Microsoft-Azure (US GOV)

```md
us-gov
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
├── ipv6_mini.txt
└── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/us-gov/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/us-gov/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/us-gov/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/us-gov/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/us-gov/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/microsoft-azure/us-gov/ipv6_comma.txt
```

## ORACLE (Oracle Cloud Infrastructure(OCI))

```md
oracle
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
└── timestamp.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/oracle/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/oracle/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/oracle/ipv4_comma.txt
```

## Vultr

```md
vultr
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
└── ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/vultr/ipv4.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/vultr/ipv4_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/vultr/ipv4_comma.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/vultr/ipv6.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/vultr/ipv6_mini.txt
```

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/vultr/ipv6_comma.txt
```

---

## UPtime bot

## Betterstack

```md
betterstack
├── ipv4.txt
├── ipv4_comma.txt
├── ipv4_mini.txt
├── ipv6.txt
├── ipv6_comma.txt
└── ipv6_mini.txt
```

### IPv4

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/betterstack/ipv4.txt
```

### IPv6

```bash
https://raw.githubusercontent.com/NavyStack/ipranges/main/betterstack/ipv6.txt
```

## ETC.

```bash
find . -type f -name "*.txt" ! -name "timestamp.txt" -print | sort
```
