#!/bin/bash
set -euo pipefail

# Run these from the host with docker exec, or copy/paste inside attacker.
# Example:
#   docker exec -it vigilan-lab-attacker bash

echo "Ping victim"
ping -c 3 10.77.0.10

echo "HTTP request to malicious web"
curl -I http://172.29.0.80

echo "DNS query to fake domain"
dig @172.29.0.53 bad.test

echo "Basic port scan"
nmap -sS -p 22,80 10.77.0.10
