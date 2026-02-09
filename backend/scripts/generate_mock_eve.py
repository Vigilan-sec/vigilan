#!/usr/bin/env python3
"""Generate realistic mock EVE.json data for development and testing.

Usage:
    # Batch mode: write 500 events to a file
    python generate_mock_eve.py --output ../../vm/shared/eve.json --count 500

    # Streaming mode: continuously append at 2 events/sec
    python generate_mock_eve.py --output ../../vm/shared/eve.json --count 0 --rate 2.0
"""

import argparse
import json
import random
import sys
import time
from datetime import datetime, timezone, timedelta

INTERNAL_IPS = [
    "192.168.56.1", "192.168.56.10", "192.168.56.20",
    "192.168.56.30", "10.0.2.15", "10.0.2.2",
]

EXTERNAL_IPS = [
    "93.184.216.34", "142.250.74.206", "151.101.1.140",
    "104.16.132.229", "1.1.1.1", "8.8.8.8",
    "52.85.132.67", "185.199.108.153", "13.107.42.14",
]

SIGNATURES = [
    {"sid": 2024897, "msg": "ET SCAN Nmap Scripting Engine User-Agent Detected", "category": "Attempted Information Leak", "severity": 2},
    {"sid": 2013028, "msg": "ET POLICY curl User-Agent Outbound", "category": "Potentially Bad Traffic", "severity": 3},
    {"sid": 2027757, "msg": "ET INFO Outbound HTTP GET Request", "category": "Misc activity", "severity": 3},
    {"sid": 2210054, "msg": "SURICATA STREAM ESTABLISHED SYN resend", "category": "Generic Protocol Command Decode", "severity": 3},
    {"sid": 2100498, "msg": "GPL ICMP_INFO PING *NIX", "category": "Misc activity", "severity": 3},
    {"sid": 9000001, "msg": "VIGILAN TEST - DNS Query Detected", "category": "Misc activity", "severity": 3},
    {"sid": 9000002, "msg": "VIGILAN TEST - HTTP Request Detected", "category": "Misc activity", "severity": 3},
    {"sid": 9000003, "msg": "VIGILAN TEST - ICMP Ping Detected", "category": "Misc activity", "severity": 3},
    {"sid": 2028759, "msg": "ET EXPLOIT Possible Apache Log4j RCE (CVE-2021-44228)", "category": "Attempted Administrator Privilege Gain", "severity": 1},
    {"sid": 2034631, "msg": "ET MALWARE Win32/AgentTesla Exfil via SMTP", "category": "A Network Trojan was detected", "severity": 1},
    {"sid": 2019401, "msg": "ET SCAN Possible Nmap User-Agent Detected", "category": "Attempted Information Leak", "severity": 2},
    {"sid": 2016150, "msg": "ET INFO Session Traversal Utilities for NAT", "category": "Misc activity", "severity": 3},
]

DOMAINS = [
    "example.com", "google.com", "github.com", "api.openai.com",
    "cdn.jsdelivr.net", "registry.npmjs.org", "pypi.org",
    "suspicious-domain.xyz", "malware-c2.ru", "phishing-site.tk",
]

HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD"]
HTTP_PATHS = ["/", "/api/v1/data", "/login", "/index.html", "/robots.txt", "/wp-admin/"]
USER_AGENTS = [
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "curl/8.1.2",
    "python-requests/2.31.0",
    "Nmap Scripting Engine",
    "Wget/1.21.3",
]

TLS_VERSIONS = ["TLSv1.2", "TLSv1.3"]


def _ts(base: datetime, offset_ms: int = 0) -> str:
    t = base + timedelta(milliseconds=offset_ms)
    return t.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+0000"


def _flow_id() -> int:
    return random.randint(100000000, 9999999999)


def _community_id() -> str:
    return f"1:{random.randbytes(8).hex()}"


def generate_alert(ts: datetime) -> dict:
    sig = random.choice(SIGNATURES)
    src = random.choice(INTERNAL_IPS + EXTERNAL_IPS)
    dst = random.choice(INTERNAL_IPS + EXTERNAL_IPS)
    proto = random.choice(["TCP", "UDP", "ICMP"])
    return {
        "timestamp": _ts(ts),
        "flow_id": _flow_id(),
        "in_iface": "enp0s3",
        "event_type": "alert",
        "src_ip": src,
        "src_port": random.randint(1024, 65535) if proto != "ICMP" else None,
        "dest_ip": dst,
        "dest_port": random.choice([80, 443, 22, 53, 8080]) if proto != "ICMP" else None,
        "proto": proto,
        "community_id": _community_id(),
        "alert": {
            "action": random.choice(["allowed", "allowed", "allowed", "blocked"]),
            "gid": 1,
            "signature_id": sig["sid"],
            "rev": random.randint(1, 5),
            "signature": sig["msg"],
            "category": sig["category"],
            "severity": sig["severity"],
        },
    }


def generate_flow(ts: datetime) -> dict:
    src = random.choice(INTERNAL_IPS)
    dst = random.choice(EXTERNAL_IPS)
    proto = random.choice(["TCP", "TCP", "TCP", "UDP"])
    age = random.randint(1, 300)
    start = ts - timedelta(seconds=age)
    return {
        "timestamp": _ts(ts),
        "flow_id": _flow_id(),
        "in_iface": "enp0s3",
        "event_type": "flow",
        "src_ip": src,
        "src_port": random.randint(1024, 65535),
        "dest_ip": dst,
        "dest_port": random.choice([80, 443, 22, 53, 8080, 3000]),
        "proto": proto,
        "community_id": _community_id(),
        "app_proto": random.choice(["http", "tls", "dns", "ssh", "failed"]),
        "flow": {
            "pkts_toserver": random.randint(1, 200),
            "pkts_toclient": random.randint(1, 200),
            "bytes_toserver": random.randint(100, 50000),
            "bytes_toclient": random.randint(100, 500000),
            "start": _ts(start),
            "end": _ts(ts),
            "age": age,
            "state": random.choice(["new", "established", "closed"]),
            "reason": random.choice(["timeout", "forced", "shutdown"]),
            "alerted": random.random() < 0.1,
        },
    }


def generate_dns(ts: datetime) -> dict:
    domain = random.choice(DOMAINS)
    return {
        "timestamp": _ts(ts),
        "flow_id": _flow_id(),
        "in_iface": "enp0s3",
        "event_type": "dns",
        "src_ip": random.choice(INTERNAL_IPS),
        "src_port": random.randint(1024, 65535),
        "dest_ip": random.choice(["1.1.1.1", "8.8.8.8", "192.168.56.1"]),
        "dest_port": 53,
        "proto": "UDP",
        "community_id": _community_id(),
        "dns": {
            "type": random.choice(["query", "answer"]),
            "id": random.randint(1, 65535),
            "rrname": domain,
            "rrtype": random.choice(["A", "AAAA", "CNAME", "MX"]),
            "rcode": "NOERROR" if random.random() > 0.1 else "NXDOMAIN",
            "tx_id": random.randint(0, 10),
        },
    }


def generate_http(ts: datetime) -> dict:
    return {
        "timestamp": _ts(ts),
        "flow_id": _flow_id(),
        "in_iface": "enp0s3",
        "event_type": "http",
        "src_ip": random.choice(INTERNAL_IPS),
        "src_port": random.randint(1024, 65535),
        "dest_ip": random.choice(EXTERNAL_IPS),
        "dest_port": random.choice([80, 8080]),
        "proto": "TCP",
        "community_id": _community_id(),
        "http": {
            "hostname": random.choice(DOMAINS),
            "url": random.choice(HTTP_PATHS),
            "http_user_agent": random.choice(USER_AGENTS),
            "http_method": random.choice(HTTP_METHODS),
            "protocol": "HTTP/1.1",
            "status": random.choice([200, 200, 200, 301, 404, 403, 500]),
            "length": random.randint(100, 50000),
        },
    }


def generate_tls(ts: datetime) -> dict:
    domain = random.choice(DOMAINS)
    return {
        "timestamp": _ts(ts),
        "flow_id": _flow_id(),
        "in_iface": "enp0s3",
        "event_type": "tls",
        "src_ip": random.choice(INTERNAL_IPS),
        "src_port": random.randint(1024, 65535),
        "dest_ip": random.choice(EXTERNAL_IPS),
        "dest_port": 443,
        "proto": "TCP",
        "community_id": _community_id(),
        "tls": {
            "subject": f"CN={domain}",
            "issuerdn": "C=US, O=Let's Encrypt, CN=R3",
            "version": random.choice(TLS_VERSIONS),
            "sni": domain,
            "fingerprint": random.randbytes(20).hex(":"),
        },
    }


GENERATORS = [
    (0.15, generate_alert),
    (0.45, generate_flow),
    (0.65, generate_dns),
    (0.85, generate_http),
    (1.00, generate_tls),
]


def generate_event(ts: datetime) -> dict:
    r = random.random()
    for threshold, gen_fn in GENERATORS:
        if r < threshold:
            return gen_fn(ts)
    return generate_tls(ts)


def main():
    parser = argparse.ArgumentParser(description="Generate mock Suricata EVE.json data")
    parser.add_argument("--output", "-o", default="-", help="Output file (- for stdout)")
    parser.add_argument("--count", "-n", type=int, default=100, help="Number of events (0 = infinite)")
    parser.add_argument("--rate", "-r", type=float, default=0.0, help="Events per second (0 = no delay)")
    args = parser.parse_args()

    out = sys.stdout if args.output == "-" else open(args.output, "a")

    try:
        i = 0
        while args.count == 0 or i < args.count:
            ts = datetime.now(timezone.utc)
            event = generate_event(ts)
            line = json.dumps(event, default=str)
            out.write(line + "\n")
            out.flush()
            i += 1
            if args.rate > 0:
                time.sleep(1.0 / args.rate)
    except KeyboardInterrupt:
        pass
    finally:
        if out is not sys.stdout:
            out.close()

    if args.output != "-":
        print(f"Wrote {i} events to {args.output}")


if __name__ == "__main__":
    main()
