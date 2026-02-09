FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

# Install Suricata from official PPA + iptables for gateway mode
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        software-properties-common \
        gnupg2 && \
    add-apt-repository -y ppa:oisf/suricata-stable && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        suricata \
        iptables && \
    suricata-update && \
    apt-get purge -y software-properties-common gnupg2 && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy configuration
COPY suricata.yaml /etc/suricata/suricata.yaml
COPY local.rules /etc/suricata/rules/local.rules
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Log directory (volume mount point)
RUN mkdir -p /var/log/suricata

ENTRYPOINT ["/entrypoint.sh"]
