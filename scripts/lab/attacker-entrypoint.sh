#!/bin/bash
set -eu

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
  sed -i "s/^PrintMotd.*/PrintMotd no/" /etc/ssh/sshd_config
else
  echo "PrintMotd no" >> /etc/ssh/sshd_config
fi

cat > /etc/issue.net << 'EOF'
ATTACKER
EOF
if grep -q "^Banner" /etc/ssh/sshd_config; then
  sed -i "s|^Banner.*|Banner /etc/issue.net|" /etc/ssh/sshd_config
else
  echo "Banner /etc/issue.net" >> /etc/ssh/sshd_config
fi

cat > /etc/profile.d/vigilan.sh << 'EOF'
#!/bin/sh
printf "\033[1;31m\n"
cat << 'LOGO'
        _
       / \      _-'
     _/|  \-''- _ /
__-' { |          \
    /             \
    /       "o.  |o }
    |            \ ;
                  ',
       \_         __\
         ''-_    \.//
           / '-____'
          /
        _'
      _-'
LOGO
printf "\n"
printf "vigilan attacker\n"
printf "\033[0m\n"
EOF
chmod +x /etc/profile.d/vigilan.sh

echo "Attacker ready. SSH: root/root"
exec /usr/sbin/sshd -D
