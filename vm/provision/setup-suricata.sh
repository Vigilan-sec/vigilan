#!/bin/bash
set -euo pipefail

echo "=== Vigilan IDS VM Provisioning ==="

# 1. Add Suricata PPA and install
add-apt-repository -y ppa:oisf/suricata-stable
apt-get update
apt-get install -y suricata suricata-update jq

# 2. Update Suricata rules (Emerging Threats Open)
suricata-update

# 3. Deploy custom suricata config
cp /vagrant/provision/suricata.yaml /etc/suricata/suricata.yaml

# 4. Copy custom test rules
cp /vagrant/provision/local.rules /etc/suricata/rules/local.rules

# 5. Symlink eve.json to shared folder
mkdir -p /vagrant_shared
rm -f /var/log/suricata/eve.json
ln -sf /vagrant_shared/eve.json /var/log/suricata/eve.json

# 6. Enable IP forwarding (future gateway mode)
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf

# 7. Identify main network interface
IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
echo "Detected interface: ${IFACE}"

# 8. Configure Suricata to listen on detected interface
sed -i "s/interface: eth0/interface: ${IFACE}/" /etc/suricata/suricata.yaml

# 9. Enable and start Suricata
systemctl enable suricata
systemctl restart suricata

# 10. Verify
sleep 3
if systemctl is-active --quiet suricata; then
    echo "Suricata is running."
else
    echo "WARNING: Suricata failed to start."
    journalctl -u suricata --no-pager -n 20
fi

echo "=== Provisioning complete ==="
