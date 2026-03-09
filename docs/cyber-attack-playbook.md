# Cyber attack playbook for the Vigilan lab

This document explains the LAN-focused cyber scenarios added for the IDS/IPS demo, why they fit the current lab, and how to run them safely.

## What changed

The repository now includes a small manual playbook for higher-signal attack demos on top of the existing auto-running traffic generator.

- `suricata/local.rules`: added five new detections for manual cyber demos.
- `scripts/lab/advanced_scenarios.sh`: attacker-side scenarios that generate detectable traffic.
- `scripts/lab/reverse_shell_callback.sh`: victim-side callback simulation used for the reverse-shell demo.
- `scripts/lab/run_attack_playbook.sh`: host-side helper that runs one named scenario or all of them.
- `scripts/lab/README.md` and `README.md`: added pointers to the new playbook flow.

## Why these scenarios

The goal was to stay close to a real LAN monitoring demo while avoiding expensive tooling or fragile services. The chosen scenarios are:

1. **SSH brute-force burst**
2. **SQL injection probe**
3. **Command injection probe**
4. **DNS exfiltration burst**
5. **Reverse shell callback simulation**

They are all visible at network level, easy to explain in class, and safe to replay in Docker.

## Scenario overview

| Scenario | What it demonstrates | Main observables | Suricata SID |
| --- | --- | --- | --- |
| SSH brute-force burst | Rapid repeated access attempts to a management service | Multiple SSH handshakes to port 22 in a short window | `9000105` |
| SQL injection probe | App-layer exploitation attempts over HTTP | Suspicious URI patterns such as `UNION-SELECT` or auth bypass payloads | `9000106`, `9000107` |
| Command injection probe | Remote command execution attempts through web parameters | Query strings containing `cmd=` / `exec=` plus command markers | `9000108` |
| DNS exfiltration burst | Small chunks of encoded data sent over DNS | Repeated long labels ending in `.exfil.lab` | `9000109` |
| Reverse shell callback simulation | A compromised host calling back to an operator port | Victim-originated connection to TCP/4444 | `9000110` |

## How to run the playbook

Start the lab as usual:

```bash
docker compose up -d --build
```

Then run a single scenario from the repository root:

```bash
bash scripts/lab/run_attack_playbook.sh ssh-burst
bash scripts/lab/run_attack_playbook.sh sqli
bash scripts/lab/run_attack_playbook.sh cmdi
bash scripts/lab/run_attack_playbook.sh dns-exfil
bash scripts/lab/run_attack_playbook.sh reverse-shell
```

Or run the whole manual playbook:

```bash
bash scripts/lab/run_attack_playbook.sh all
```

Expected result:

- Suricata emits new alerts into `eve.json`
- the backend ingests them
- the dashboard shows them live
- for the reverse shell callback simulation, the host helper also prints what the attacker listener received

## Implementation notes

### 1. SSH brute-force burst

This is intentionally implemented as repeated short SSH handshakes rather than a credential brute-force tool. That keeps the demo deterministic and avoids adding heavier offensive tooling.

### 2. SQL injection probe

The requests target a lightweight HTTP service now started inside the victim container. That guarantees the probe traffic crosses the gateway between the two LANs, so the IDS/IPS path stays easy to demonstrate.

### 3. Command injection probe

The command-injection traffic uses obvious markers like `cmd=` and `/etc/passwd` so the detection remains easy to explain to students.

### 4. DNS exfiltration burst

The script base64-encodes a demo string, splits it into chunks, and sends the chunks as DNS labels under `.exfil.lab`. This gives a concrete example of data theft through a protocol that often looks harmless.

### 5. Reverse shell callback simulation

This is a lightweight callback demo, not a full interactive shell. The victim opens a TCP connection to the attacker listener on port `4444` and sends a few host details. That keeps the scenario safe while still generating the traffic pattern an IDS would care about.

## Teaching suggestions

- Start with the original automated background traffic so students see the normal dashboard.
- Run one advanced scenario at a time and ask students to identify the protocol, source, destination, and signature.
- Compare HTTP exploit probes with DNS exfiltration to show that attacks do not always look like obvious malware downloads.
- Use the reverse shell callback simulation to explain why outbound connections can be just as suspicious as inbound ones.

## Follow-up scenarios worth adding later

These are still good candidates once you want a larger lab:

- limited SYN flood / DoS pattern
- SMB or FTP credential attacks
- web shell upload plus callback
- phishing-style credential capture on the malicious web server
- correlation views that group recon -> exploit -> callback into one incident story

## Validation notes

During this change, the existing repo validation baseline showed:

- `backend/tests` currently contains no collected tests
- `frontend` linting currently fails on pre-existing React hook / immutability issues unrelated to this playbook work

Those baseline issues were left unchanged so the cyber enhancement work stayed scoped to the lab.
