#!/bin/bash
set -euo pipefail

DEFAULT_GATEWAY="${DEFAULT_GATEWAY:-10.77.0.2}"

if command -v apk >/dev/null 2>&1; then
  apk add --no-cache openssh
else
  apt-get update
  apt-get install -y --no-install-recommends openssh-server
fi

mkdir -p /run/sshd
ssh-keygen -A

ip route replace default via "${DEFAULT_GATEWAY}"

# Demo-only credentials
printf "root:root\n" | chpasswd
sed -i "s/#PermitRootLogin.*/PermitRootLogin yes/" /etc/ssh/sshd_config
sed -i "s/#PasswordAuthentication.*/PasswordAuthentication yes/" /etc/ssh/sshd_config

if grep -q "^PrintMotd" /etc/ssh/sshd_config; then
  sed -i "s/^PrintMotd.*/PrintMotd yes/" /etc/ssh/sshd_config
else
  echo "PrintMotd yes" >> /etc/ssh/sshd_config
fi

cat > /etc/motd << 'EOF'
\033[1;31m
 __     ___ _____ _      _       _   _   _   _   _
 \ \   / (_)  __ \ |    | |     | | | | | | | | | |
  \ \_/ / _| |  | | |    | | __ _| |_| |_| |_| |_| |
   \   / | | |  | | |    | |/ _` | __| __| __| __|
    | |  | | |__| | |____| | (_| | |_| |_| |_| |_ 
    |_|  |_|_____/|______|_|\__,_|\__|\__|\__|\__|

                V I G I L A N   L A B
                    A T T A C K E R
\033[0m
EOF

cat > /etc/issue.net << 'EOF'
\033[1;31m
VIGILAN LAB - ATTACKER
\033[0m
EOF
if grep -q "^Banner" /etc/ssh/sshd_config; then
  sed -i "s|^Banner.*|Banner /etc/issue.net|" /etc/ssh/sshd_config
else
  echo "Banner /etc/issue.net" >> /etc/ssh/sshd_config
fi

echo "Attacker ready. SSH: root/root"
exec /usr/sbin/sshd -D
