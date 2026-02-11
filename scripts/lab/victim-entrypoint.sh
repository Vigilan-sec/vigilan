#!/bin/bash
set -eu

DEFAULT_GATEWAY="${DEFAULT_GATEWAY:-10.78.0.2}"

mkdir -p /run/sshd
if [ -z "$(ls -A /etc/ssh/ssh_host_* 2>/dev/null || true)" ]; then
  ssh-keygen -A
fi
ip route replace default via "${DEFAULT_GATEWAY}"
sysctl -w net.ipv4.conf.all.accept_redirects=0
sysctl -w net.ipv4.conf.default.accept_redirects=0

# Demo-only credentials
printf "root:root\n" | chpasswd
sed -i "/^PermitRootLogin/d" /etc/ssh/sshd_config
sed -i "/^PasswordAuthentication/d" /etc/ssh/sshd_config
sed -i "/^PubkeyAuthentication/d" /etc/ssh/sshd_config
printf "PermitRootLogin yes\nPasswordAuthentication yes\nPubkeyAuthentication yes\n" >> /etc/ssh/sshd_config
if grep -q "^UseDNS" /etc/ssh/sshd_config; then
  sed -i "s/^UseDNS.*/UseDNS no/" /etc/ssh/sshd_config
else
  echo "UseDNS no" >> /etc/ssh/sshd_config
fi
if grep -q "^LogLevel" /etc/ssh/sshd_config; then
  sed -i "s/^LogLevel.*/LogLevel VERBOSE/" /etc/ssh/sshd_config
else
  echo "LogLevel VERBOSE" >> /etc/ssh/sshd_config
fi

if grep -q "^PrintMotd" /etc/ssh/sshd_config; then
  sed -i "s/^PrintMotd.*/PrintMotd no/" /etc/ssh/sshd_config
else
  echo "PrintMotd no" >> /etc/ssh/sshd_config
fi

printf "VIGILAN LAB - VICTIM\n" > /etc/issue.net
if grep -q "^Banner" /etc/ssh/sshd_config; then
  sed -i "s|^Banner.*|Banner /etc/issue.net|" /etc/ssh/sshd_config
else
  echo "Banner /etc/issue.net" >> /etc/ssh/sshd_config
fi

cat > /etc/profile.d/vigilan.sh << 'EOF'
#!/bin/sh
printf "\033[1;32m\n"
cat << 'LOGO'

                              __
                     /\    .-" /
                    /  ; .'  .' 
                   :   :/  .'   
                    \  ;-.'     
       .--""""--..__/     `.    
     .'           .'    `o  \   
    /                    `   ;  
   :                  \      :  
 .-;        -.         `.__.-'  
:  ;          \     ,   ;       
'._:           ;   :   (        
    \/  .__    ;    \   `-.     
 bug ;     "-,/_..--"`-..__)    
     '""--.._:

LOGO
printf "\n"
printf "vigilan : victim\n"
printf "\033[0m\n"
EOF
chmod +x /etc/profile.d/vigilan.sh

echo "Victim ready. SSH: root/root"

# Launch benign traffic simulation in background
if [ -f /lab/benign_traffic.sh ]; then
  echo "Starting scenario traffic simulation..."
  (
    while true; do
      /lab/scenario_victim.sh
      sleep 60
    done
  ) >/var/log/vigilan-benign.log 2>&1 &
fi

exec /usr/sbin/sshd -D -e
