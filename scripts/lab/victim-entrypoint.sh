#!/bin/bash
set -euo pipefail

DEFAULT_GATEWAY="${DEFAULT_GATEWAY:-10.77.0.2}"

apt-get update
apt-get install -y --no-install-recommends \
  openssh-server \
  iproute2 \
  iputils-ping \
  curl \
  dnsutils

mkdir -p /run/sshd
ssh-keygen -A
ip route replace default via "${DEFAULT_GATEWAY}"

# Demo-only credentials
printf "root:root\n" | chpasswd
sed -i "s/#PermitRootLogin.*/PermitRootLogin yes/" /etc/ssh/sshd_config
sed -i "s/#PasswordAuthentication.*/PasswordAuthentication yes/" /etc/ssh/sshd_config

printf "VIGILAN LAB - VICTIM\n" > /etc/motd
printf "VIGILAN LAB - VICTIM\n" > /etc/issue.net
if grep -q "^Banner" /etc/ssh/sshd_config; then
  sed -i "s|^Banner.*|Banner /etc/issue.net|" /etc/ssh/sshd_config
else
  echo "Banner /etc/issue.net" >> /etc/ssh/sshd_config
fi

echo "Victim ready. SSH: root/root"
exec /usr/sbin/sshd -D
