#!/bin/bash
set -euo pipefail

# Benign traffic simulation - legitimate web traffic from victim to external sites
# Run from victim container or via: docker exec -it victim bash /lab/benign_traffic.sh

echo "=== Benign Traffic Generation ==="

echo "1. DNS query to Google"
nslookup google.com 8.8.8.8 || true

echo "2. HTTP GET to Google"
curl -I http://google.com --connect-timeout 5 || true

echo "3. DNS query to Wikipedia"
nslookup wikipedia.org 8.8.8.8 || true

echo "4. HTTP GET to Wikipedia"
curl -I http://www.wikipedia.org --connect-timeout 5 || true

echo "5. HTTPS to GitHub"
curl -I https://github.com --connect-timeout 5 || true

echo "6. DNS query to CloudFlare DNS"
nslookup cloudflare.com 1.1.1.1 || true

echo "7. Multiple DNS queries (simulating normal browsing)"
for domain in github.com stackoverflow.com python.org rust-lang.org; do
  echo "  Query: $domain"
  nslookup "$domain" 8.8.8.8 || true
  sleep 1
done

echo "8. HTTP range request"
curl -r 0-100 http://example.com --connect-timeout 5 || true

echo "=== Benign traffic complete ==="
