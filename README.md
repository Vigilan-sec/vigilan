# Vigilan

IDS (Intrusion Detection System) avec dashboard web temps-réel.

Suricata dans un container Docker capture le trafic réseau, un backend FastAPI ingère les logs EVE.json, et un dashboard Next.js affiche les alertes, flows et événements en temps réel via WebSocket.

## Architecture

![Architecture](/images/architecture.png)

```
Docker (Suricata) → eve.json → shared volume → FastAPI → SQLite + WebSocket → Next.js
```

## Prérequis

- Docker + Docker Compose
- (Optionnel pour dev local) Python 3.11+, Node.js 18+

## Quickstart (Docker)

```bash
# 1. Configurer l'environnement
cp .env.docker .env
# Éditer .env : mettre SURICATA_INTERFACE au nom de votre interface réseau (ip link show)

# 2. Build et lancement
docker compose build
docker compose up -d

# 3. Accès
# Dashboard : http://localhost:3000
# API docs  : http://localhost:8000/docs

# 4. Logs
docker compose logs -f

# 5. Arrêt
docker compose down
```

## Mode gateway (optionnel)

Pour que Suricata capture le trafic d'autres appareils du réseau :

```bash
# Éditer .env : GATEWAY_MODE=true
# Sur les autres appareils, configurer la passerelle par défaut vers l'IP de l'hôte Docker
docker compose up -d suricata
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

| Composant | Technologie |
|-----------|------------|
| IDS Engine | Suricata (container Docker) |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Frontend | Next.js 15 + Tailwind CSS |
| Temps réel | WebSocket |
| Infra | Docker Compose |

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
