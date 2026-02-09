#!/bin/bash
set -euo pipefail

IFACE="${SURICATA_INTERFACE:-eth0}"
HOME_NET="${SURICATA_HOME_NET:-[192.168.0.0/16,10.0.0.0/8,172.16.0.0/12]}"
GATEWAY="${GATEWAY_MODE:-false}"

echo "=== Vigilan Suricata Container ==="
echo "Interface: ${IFACE}"
echo "HOME_NET: ${HOME_NET}"
echo "Gateway mode: ${GATEWAY}"

# Substitute interface in suricata.yaml
sed -i "s/interface: eth0/interface: ${IFACE}/" /etc/suricata/suricata.yaml

# Substitute HOME_NET in suricata.yaml
sed -i "s|HOME_NET: \".*\"|HOME_NET: \"${HOME_NET}\"|" /etc/suricata/suricata.yaml

# Gateway mode: enable IP forwarding and NAT
if [ "$GATEWAY" = "true" ]; then
    echo "Enabling IP forwarding for gateway mode..."
    sysctl -w net.ipv4.ip_forward=1

    # NAT: masquerade outbound traffic so return packets come back through us
    iptables -t nat -A POSTROUTING -o "${IFACE}" -j MASQUERADE
    iptables -A FORWARD -i "${IFACE}" -j ACCEPT
    iptables -A FORWARD -o "${IFACE}" -m state --state RELATED,ESTABLISHED -j ACCEPT
    echo "Gateway NAT rules applied."
fi

echo "Starting Suricata on ${IFACE} (pcap mode)..."
exec suricata -c /etc/suricata/suricata.yaml -i "${IFACE}" -v
