# Vigilan — Présentation du projet

## Vue d'ensemble

**Vigilan** est un système de détection d'intrusion (IDS) open-source avec un dashboard web temps réel. Il combine **Suricata** (moteur IDS) avec une application full-stack moderne pour monitorer les menaces réseau.

C'est un projet de cours ECE (ING4) à vocation pédagogique et opérationnelle : il permet de comprendre et visualiser des attaques réelles dans un environnement contrôlé.

---

## Architecture

```
Suricata (Docker) → EVE.json (alertes réseau)
        ↓
Backend FastAPI (SQLite) → WebSocket streaming
        ↓
Frontend Next.js (dashboard temps réel :3000)
```

**3 composants principaux :**

1. **Suricata IDS (container Docker)** — capture le trafic réseau et génère des alertes au format EVE.json
2. **Backend FastAPI (Python)** — surveille EVE.json, stocke en SQLite, sert l'API REST, pousse les mises à jour via WebSocket, et fournit un système RAG pour expliquer les alertes
3. **Frontend Next.js** — dashboard React affichant les alertes, flux et statistiques réseau en temps réel

---

## Fonctionnalités principales

### Pages de l'application
| Page | Description |
|------|-------------|
| **Dashboard** (`/`) | Résumé temps réel : stats alertes, flux, événements récents, charts IP |
| **Scénarios de sécurité** (`/security`) | Visualisation des scénarios d'attaques cyber et hits récents |
| **Inventaire réseau** (`/network`) | Découverte des équipements, hôtes actifs, topologie réseau |
| **Alertes** (`/alerts`) | Tableau filtrable des alertes IDS avec niveaux de sévérité |
| **Détail alerte** (`/alerts/[id]`) | Vue détaillée avec explication générée par LLM (RAG) |
| **Flux** (`/flows`) | Données de flux réseau (IPs source/destination, protocoles, octets) |
| **Événements** (`/events`) | Événements bruts EVE.json de Suricata |
| **Status** (`/status`) | Santé du système et état du watcher |
| **Assistant** (`/assistant`) | Assistant IA (RAG) pour l'analyse de sécurité |
| **Paramètres** (`/settings`) | Options de configuration |
| **Admin** (`/admin/users`) | Gestion des utilisateurs (admin uniquement) |

### Autres fonctionnalités clés
- **Alertes temps réel** via WebSocket (push serveur dès détection)
- **Authentification & RBAC** — utilisateurs locaux avec rôles admin/standard
- **Accès HTTPS sécurisé** — endpoint TLS sur le port 3443
- **Explications IA** — LLM local (Ollama) ou cloud (NVIDIA NIM / Kimi) pour expliquer les alertes
- **Scénarios d'attaques pré-construits** — brute-force SSH, injection SQL, injection de commandes, exfiltration DNS, reverse shells
- **Environnement lab** — deux LAN simulés (attaquant/victime) via Docker Compose

---

## Stack technologique

| Couche | Technologie |
|--------|-------------|
| Moteur IDS | Suricata (Docker) |
| Backend | FastAPI, SQLAlchemy, SQLite, aiosqlite |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Temps réel | WebSocket |
| Format données | EVE.json (sortie Suricata) |
| RAG / LLM | LangChain, ChromaDB, Ollama ou NVIDIA NIM |
| Infrastructure | Docker Compose |

---

## Lancement rapide

- **Production** : `docker compose up -d` — démarre l'ensemble du lab IDS
- **Développement** : mode local avec générateur de données mock ou Suricata réel
- **Dashboard** : http://localhost:3000
- **Accès sécurisé** : https://localhost:3443
- **Docs API** : http://localhost:8000/docs

---

## Valeur pédagogique

Le projet inclut des playbooks d'attaques pré-construits (scan SSH, injection SQL, exfiltration DNS, reverse shells…) qui s'exécutent automatiquement pour démontrer des patterns d'attaques réels et la détection IDS dans un environnement sûr et contrôlé.

Il est destiné aux étudiants en sécurité, administrateurs réseau, et formateurs en cybersécurité.

---

## Positionnement — Retour des entretiens entreprises

Suite à des entretiens menés auprès d'entreprises, nous avons réorienté notre vision du produit : **Vigilan est plus adapté à l'éducation et à la prévention qu'à un déploiement en entreprise réelle.**

**Pourquoi les PME ne sont pas la cible principale :**
- Les PME externalisent généralement leur infrastructure réseau à des prestataires (MSP, opérateurs, intégrateurs) — elles ne gèrent pas leur propre infra et n'ont donc ni les ressources ni les compétences en interne pour opérer un IDS.
- Les grandes entreprises disposent déjà de solutions IDS/SIEM industrielles (Splunk, Elastic SIEM, etc.) bien établies.

**La vraie valeur de Vigilan est pédagogique :**
- Écoles d'ingénieurs et universités (cursus cybersécurité, réseaux)
- Centres de formation professionnelle en sécurité informatique
- Ateliers et CTF pour initier à la détection d'intrusion
- Démonstrations lors d'événements ou de sensibilisations à la cybersécurité

Vigilan offre un environnement clé en main pour apprendre à détecter, analyser et comprendre des attaques réelles — sans risque, sans infrastructure complexe à gérer.
