#!/bin/bash
set -eu

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
exec /usr/sbin/sshd -D -e
