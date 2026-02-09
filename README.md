# Vigilan

IDS (Intrusion Detection System) avec dashboard web temps-réel.

Suricata dans une VM Vagrant capture le trafic réseau, un backend FastAPI ingère les logs EVE.json, et un dashboard Next.js affiche les alertes, flows et événements en temps réel via WebSocket.

## Architecture

![Architecture](/architecture.png)

```
Vagrant VM (Suricata) → eve.json → synced_folder → FastAPI (host) → SQLite + WebSocket → Next.js
```

## Prérequis

- Python 3.11+
- Node.js 18+
- VirtualBox + Vagrant (pour la VM Suricata)

## Quickstart (mode mock, sans VM)

```bash
# 1. Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Générer des données mock
python scripts/generate_mock_eve.py --output ../vm/shared/eve.json --count 500

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

## Quickstart (avec VM Suricata)

```bash
# 1. Lancer la VM
cd vm
vagrant up

# 2. Lancer backend + frontend
bash scripts/dev.sh

# 3. Générer du trafic depuis la VM
vagrant ssh -c "curl http://example.com"
vagrant ssh -c "ping -c 3 8.8.8.8"
# → Les alertes apparaissent en temps réel sur le dashboard
```

## Structure

```
vigilan/
├── backend/          # FastAPI + SQLite + EVE watcher
├── frontend/         # Next.js dashboard
├── vm/               # Vagrant + Suricata
│   ├── Vagrantfile
│   ├── provision/    # Scripts d'installation Suricata
│   └── shared/       # Synced folder (eve.json)
└── scripts/          # Helpers (dev.sh)
```

## Stack

| Composant | Technologie |
|-----------|------------|
| IDS Engine | Suricata (dans VM Vagrant) |
| Backend | FastAPI + SQLAlchemy + SQLite |
| Frontend | Next.js 15 + Tailwind CSS |
| Temps réel | WebSocket |
| VM | Vagrant + VirtualBox (Ubuntu 22.04) |

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
