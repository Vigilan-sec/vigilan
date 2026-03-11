# Vigilan

IDS (Intrusion Detection System) avec dashboard web temps-réel.

Suricata dans un container Docker capture le trafic réseau, un backend FastAPI ingère les logs EVE.json, et un dashboard Next.js affiche les alertes, flows et événements en temps réel via WebSocket.

## Architecture

![Architecture](/images/architecture.png)

```
Docker (Suricata) → eve.json → shared volume → FastAPI → SQLite + WebSocket → Next.js
```

Schema lab (dual-LAN, trafic force via la gateway):

```
attacker (10.77.0.20) ── LAN (10.77.0.0/24) ──
							 |            \
							 |             \  WAN (172.29.0.0/24)
						 gateway (10.77.0.2 / 10.78.0.2 / 172.29.0.2)
							 |             /
							 |            /
victim  (10.78.0.10) ── LAN2 (10.78.0.0/24) ──
```

## Prérequis

- Docker + Docker Compose
- (Optionnel pour dev local) Python 3.11+, Node.js 18+

## Quickstart (Lab IDS)

Le compose demarre un LAN simule (victime + attaquant) avec une gateway Suricata en IDS.
Les alertes alimentent le backend et le dashboard.

```bash
docker compose up -d --force-recreate --remove-orphans
```

Si vous avez des conflits de subnet, vous pouvez nettoyer les anciens reseaux Docker:

```bash
docker network prune
```

Acces:

- Dashboard : http://localhost:3000
- API docs : http://localhost:8000/docs
- Secure UI : https://localhost:3443
- Login secure local : `admin` + mot de passe genere dans `backend:/data/db/default-admin-password.txt`
- Pages principales : `/security`, `/network`
- Administration : `/admin/users` (visible uniquement pour les comptes admin)

SSH (depuis l'hote macOS):

```bash
ssh root@127.0.0.1 -p 2222  # attacker
ssh root@127.0.0.1 -p 2223  # victim
```

Mot de passe: `root`

Scripts et exemples de trafic:

- Voir scripts/lab/README.md
- Voir scripts/lab/scenarios.sh
- Voir scripts/lab/run_attack_playbook.sh pour les scenarios cyber manuels
- Voir docs/cyber-attack-playbook.md pour le contexte des nouvelles detections
- Voir docs/local-auth-and-ui-security.md pour l'auth locale, la gestion des utilisateurs et l'acces HTTPS

Arret:

```bash
docker compose down
```

## Configuration LLM/RAG (optionnel)

Le système inclut une fonctionnalité RAG (Retrieval-Augmented Generation) pour générer des explications automatiques des alertes de sécurité.

### Providers supportés

- `Ollama` pour un usage local
- `Kimi via NVIDIA NIM` pour un usage via API distante

Le choix du provider se fait dans la modale d'explication d'alerte du dashboard.
Ce choix est mémorisé uniquement pour la session navigateur courante.

### Prérequis Ollama

1. **Installer Ollama**
   - Windows/Mac : Télécharger depuis [ollama.com](https://ollama.com/download)
   - Linux :
     ```bash
     curl -fsSL https://ollama.com/install.sh | sh
     ```

2. **Installer les modèles requis**

   ```bash
   # Modèle LLM pour la génération de texte
   ollama pull mistral:latest

   # Modèle d'embeddings pour la recherche sémantique
   ollama pull mxbai-embed-large
   ```

3. **Vérifier l'installation**

   ```bash
   ollama list
   # Doit afficher mistral:latest et mxbai-embed-large
   ```

4. **Démarrer Ollama** (si non démarré automatiquement)
   ```bash
   # Le service écoute par défaut sur http://localhost:11434
   ollama serve
   ```

### Variables d'environnement

Par défaut, le backend se connecte à Ollama sur `http://localhost:11434`.

```bash
# Dans .env ou .env.docker
VIGILAN_LLM_PROVIDER_DEFAULT=ollama
VIGILAN_OLLAMA_HOST=http://localhost:11434
VIGILAN_OLLAMA_MODEL=mistral:latest
VIGILAN_EMBEDDING_MODEL=mxbai-embed-large
```

Pour activer Kimi via NVIDIA NIM en gardant Ollama disponible :

```bash
# Dans .env ou .env.docker
VIGILAN_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
VIGILAN_NIM_MODEL=moonshotai/kimi-k2-instruct
VIGILAN_NIM_API_KEY=nvapi-...
VIGILAN_NIM_TIMEOUT_SECONDS=60
```

Note Docker Compose :

- `docker compose up` lit automatiquement `.env`
- pour utiliser `.env.docker`, il faut lancer `docker compose --env-file .env.docker ...`

### Relancer après modification

Si tu utilises `.env.docker` pour les nouveaux providers, relance comme ceci depuis la racine du projet :

```bash
docker compose down
docker compose --env-file .env.docker build backend frontend
docker compose --env-file .env.docker up -d --force-recreate --remove-orphans
docker compose --env-file .env.docker ps
```

Si tu veux relancer tout le lab complet avec les nouvelles variables :

```bash
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d --build --force-recreate --remove-orphans
docker compose --env-file .env.docker ps
```

### Initialiser la base de connaissances (optionnel)

Pour améliorer les explications avec vos propres documents PDF :

```bash
# 1. Placer vos documents PDF dans data/pdf/
cd backend

# 2. Initialiser le vector store
python scripts/init_vector_store.py

# Note: ChromaDB peut avoir des problèmes de compatibilité entre versions.
# Le système fonctionne sans vector store en utilisant les connaissances générales du LLM.
```

### Utilisation

Une fois le provider configuré, l'API `/api/rag/explain-alert` est disponible pour générer des explications contextuelles des alertes.

Interface frontend :

- ouvrir une alerte depuis le dashboard
- choisir `Ollama` ou `Kimi via NVIDIA NIM`
- lancer l'explication depuis la modale

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

| Composant  | Technologie                   |
| ---------- | ----------------------------- |
| IDS Engine | Suricata (container Docker)   |
| Backend    | FastAPI + SQLAlchemy + SQLite |
| Frontend   | Next.js 15 + Tailwind CSS     |
| Temps réel | WebSocket                     |
| Infra      | Docker Compose                |

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
