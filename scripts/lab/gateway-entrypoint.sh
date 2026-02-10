#!/bin/bash
set -eu

LAN_IFACE="${LAN_IFACE:-eth0}"
LAN2_IFACE="${LAN2_IFACE:-eth1}"
WAN_IFACE="${WAN_IFACE:-eth2}"
HOME_NET="${SURICATA_HOME_NET:-[10.10.0.0/24]}"

echo "=== Vigilan Lab Gateway ==="
echo "LAN interface: ${LAN_IFACE}"
echo "LAN2 interface: ${LAN2_IFACE}"
echo "WAN interface: ${WAN_IFACE}"
echo "HOME_NET: ${HOME_NET}"

sysctl -w net.ipv4.ip_forward=1 || true
sysctl -w net.ipv4.conf.all.send_redirects=0 2>/dev/null || true
sysctl -w net.ipv4.conf.default.send_redirects=0 2>/dev/null || true
sysctl -w "net.ipv4.conf.${LAN_IFACE}.send_redirects=0" 2>/dev/null || true
sysctl -w "net.ipv4.conf.${LAN2_IFACE}.send_redirects=0" 2>/dev/null || true
sysctl -w "net.ipv4.conf.${WAN_IFACE}.send_redirects=0" 2>/dev/null || true

iptables -P FORWARD ACCEPT
iptables -A FORWARD -i "${LAN_IFACE}" -o "${LAN2_IFACE}" -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -i "${LAN2_IFACE}" -o "${LAN_IFACE}" -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -i "${LAN_IFACE}" -o "${WAN_IFACE}" -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -i "${LAN2_IFACE}" -o "${WAN_IFACE}" -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -i "${WAN_IFACE}" -o "${LAN_IFACE}" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
iptables -A FORWARD -i "${WAN_IFACE}" -o "${LAN2_IFACE}" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
iptables -t nat -A POSTROUTING -o "${WAN_IFACE}" -j MASQUERADE 2>/dev/null || true
iptables -A OUTPUT -p icmp --icmp-type redirect -j DROP 2>/dev/null || true

sed -i "s|HOME_NET: \".*\"|HOME_NET: \"${HOME_NET}\"|" /etc/suricata/suricata.yaml

awk -v lan="${LAN_IFACE}" -v lan2="${LAN2_IFACE}" '
	BEGIN { inpcap = 0 }
	/^pcap:/ {
		print "pcap:";
		print "  - interface: " lan;
		print "    buffer-size: 67108864";
		print "    checksum-checks: auto";
		print "  - interface: " lan2;
		print "    buffer-size: 67108864";
		print "    checksum-checks: auto";
		inpcap = 1;
		next
	}
	inpcap {
		if ($0 ~ /^[^[:space:]]/) {
			inpcap = 0;
			print
		}
		next
	}
	{ print }
' /etc/suricata/suricata.yaml > /etc/suricata/suricata.yaml.tmp && mv /etc/suricata/suricata.yaml.tmp /etc/suricata/suricata.yaml

echo "Starting Suricata (pcap on ${LAN_IFACE}, ${LAN2_IFACE})"
exec suricata -c /etc/suricata/suricata.yaml --pcap -v
