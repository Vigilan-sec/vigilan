# Vigilan Lab (IDS)

This lab simulates a dual-LAN setup where all traffic goes through a Suricata gateway.
It is meant for IDS demos before moving to IPS.

## Start

From repository root:

```
docker compose up -d --build
```

If you see orphan container warnings, you can clean them with:

```
docker compose up -d --build --remove-orphans
```

## Access

- Dashboard: http://localhost:3000
- API docs:  http://localhost:8000/docs

## SSH to victim

```
docker exec -it victim bash
# SSH is also running inside the container
```

## Attacker shell

```
docker exec -it attacker bash
```

## Traffic examples

See scripts/lab/scenarios.sh for example commands.

For richer cyber demos, you can also run the manual playbook from the repository root:

```bash
bash scripts/lab/run_attack_playbook.sh ssh-burst
bash scripts/lab/run_attack_playbook.sh all
```

Full context and the detection mapping are documented in `docs/cyber-attack-playbook.md`.

## Stop

```
docker compose down
```
