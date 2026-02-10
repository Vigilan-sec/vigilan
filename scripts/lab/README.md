# Vigilan Lab (IDS)

This lab simulates a small LAN where all traffic goes through a Suricata gateway.
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
docker exec -it vigilan-victim bash
# SSH is also running inside the container
```

## Attacker shell

```
docker exec -it vigilan-attacker bash
```

## Traffic examples

See scripts/lab/scenarios.sh for example commands.

## Stop

```
docker compose down
```
