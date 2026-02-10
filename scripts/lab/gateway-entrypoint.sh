#!/bin/bash
set -eu

LAN_IFACE="${LAN_IFACE:-eth0}"
WAN_IFACE="${WAN_IFACE:-eth1}"
HOME_NET="${SURICATA_HOME_NET:-[10.10.0.0/24]}"

echo "=== Vigilan Lab Gateway ==="
echo "LAN interface: ${LAN_IFACE}"
echo "WAN interface: ${WAN_IFACE}"
echo "HOME_NET: ${HOME_NET}"

sysctl -w net.ipv4.ip_forward=1

iptables -P FORWARD ACCEPT
iptables -A FORWARD -i "${LAN_IFACE}" -o "${WAN_IFACE}" -j ACCEPT
iptables -A FORWARD -i "${WAN_IFACE}" -o "${LAN_IFACE}" -m state --state RELATED,ESTABLISHED -j ACCEPT

sed -i "s/interface: .*/interface: ${LAN_IFACE}/" /etc/suricata/suricata.yaml
sed -i "s|HOME_NET: \".*\"|HOME_NET: \"${HOME_NET}\"|" /etc/suricata/suricata.yaml

echo "Starting Suricata on ${LAN_IFACE} (IDS mode)"
exec suricata -c /etc/suricata/suricata.yaml -i "${LAN_IFACE}" -v
