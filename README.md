# Vigilan

IDS (Intrusion Detection System) avec dashboard web temps-réel.

Suricata dans un container Docker capture le trafic réseau, un backend FastAPI ingère les logs EVE.json, et un dashboard Next.js affiche les alertes, flows et événements en temps réel via WebSocket.

## Architecture

![Architecture](/architecture.png)

```
Docker (Suricata) → eve.json → shared volume → FastAPI → SQLite + WebSocket → Next.js
```

## Prérequis

- Docker + Docker Compose
- (Optionnel pour dev local) Python 3.11+, Node.js 18+

## Quickstart (Lab IDS)

Le compose demarre un LAN simule (victime + attaquant) avec une gateway Suricata en IDS.
Les alertes alimentent le backend et le dashboard.

```bash
docker compose up -d --build
```

Si vous voyez un warning d'orphelins, relancez avec:

```bash
docker compose up -d --build --remove-orphans
```

Si vous avez des conflits de subnet, vous pouvez nettoyer les anciens reseaux Docker:

```bash
docker network prune
```

Acces:

- Dashboard : http://localhost:3000
- API docs  : http://localhost:8000/docs

SSH (depuis l'hote macOS):

```bash
ssh root@127.0.0.1 -p 2222  # attacker
ssh root@127.0.0.1 -p 2223  # victim
```

Mot de passe: `root`

Scripts et exemples de trafic:

- Voir scripts/lab/README.md
- Voir scripts/lab/scenarios.sh
 
Arret:

```bash
docker compose down
```

Depannage rapide:

```bash
# Connexion refusee au debut: attendre la fin de l'installation dans la victime
docker logs victim --tail 200

# Cle hote SSH changee apres un recreate
ssh-keygen -R "[localhost]:2222"
ssh-keygen -R "[localhost]:2223"
```

## Quickstart (mode mock, sans Suricata)

```bash
# 1. Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Générer des données mock
python scripts/generate_mock_eve.py --output ../data/eve.json --count 500

# Lancer le backend
python run.py
# → http://localhost:8000 (docs: http://localhost:8000/docs)

# 2. Frontend (autre terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Ou avec le script helper :

```bash
bash scripts/dev.sh
```

## Structure

```
vigilan/
├── backend/          # FastAPI + SQLite + EVE watcher
├── frontend/         # Next.js dashboard
├── suricata/         # Dockerfile + config Suricata
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── suricata.yaml
│   └── local.rules
├── docker-compose.yml
└── scripts/          # Helpers (dev.sh)
```

## Stack

| Composant   | Technologie                   |
| ----------- | ----------------------------- |
| IDS Engine  | Suricata (container Docker)   |
| Backend     | FastAPI + SQLAlchemy + SQLite |
| Frontend    | Next.js 15 + Tailwind CSS     |
| Temps réel | WebSocket                     |
| Infra       | Docker Compose                |

## API

- `GET /api/health` - Santé du backend
- `GET /api/status` - État du watcher + DB
- `GET /api/alerts` - Alertes (paginé, filtrable)
- `GET /api/alerts/stats` - Statistiques alertes
- `GET /api/flows` - Flows réseau
- `GET /api/flows/stats` - Statistiques flows
- `GET /api/events` - Événements EVE bruts
- `WS /api/ws/alerts` - Stream temps réel des alertes

## License

MIT
