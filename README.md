# Veille Technologique Backend — Kanban Board API (template)

Base de démarrage commune pour l'exercice de veille technologique backend (NestJS / Symfony / Spring Boot) — La Plateforme, Master 1 Développement.

Ce repository (une fois publié en tant que **template GitHub**, voir `GITHUB_SETUP.md`) permet à chaque élève de partir d'une copie indépendante avec :

- **`CAHIER_DES_CHARGES.md`** — les fonctionnalités et routes attendues, indépendamment du framework choisi.
- **`openapi.yaml`** — le contrat d'API (Swagger/OpenAPI), testable immédiatement dans Swagger Editor, Postman ou Insomnia, avant même d'avoir codé quoi que ce soit.
- **`TICKETS.md`** — le backlog détaillé : chaque ticket avec sa user story, ses critères d'acceptation (cas nominal **et** cas d'erreur explicites), sa priorité (MoSCoW) et son estimation.
- **`DEFINITION_OF_DONE.md`** — la Definition of Done commune à tous les tickets : couverture de test ≥ 80 %, documentation Swagger à jour, gestion des erreurs conforme.
- **`backlog.csv`** — le même backlog, prêt à importer en masse dans un GitHub Project.
- **`.github/ISSUE_TEMPLATE/feature.yml`** — un formulaire d'issue qui impose la structure (domaine, priorité, user story, critères d'acceptation nominal/erreurs, checklist DoD) à chaque nouveau ticket créé.
- **`GITHUB_PROJECT_SETUP.md`** — comment monter le board Kanban : attributs des tickets et regroupement par domaine (équivalent de swimlanes).

## Pourquoi ce contrat est commun

Le choix de la techno (NestJS, Symfony ou Spring Boot) est libre, mais **le contrat d'API est identique pour tout le monde**. C'est ce qui permet, en fin de veille, de comparer les implémentations sur un même socle fonctionnel plutôt que de comparer des projets qui n'auraient rien en commun.

## Pour démarrer

1. Dupliquez ce repo (bouton "Use this template" une fois qu'il est configuré comme template).
2. Lisez `CAHIER_DES_CHARGES.md`, puis `TICKETS.md` et `DEFINITION_OF_DONE.md`.
3. Importez `openapi.yaml` dans Swagger Editor / Postman pour visualiser le contrat.
4. Mettez en place votre GitHub Project à partir de `GITHUB_PROJECT_SETUP.md`.
5. Implémentez l'API dans le framework de votre choix, en respectant les routes du contrat et en cochant la DoD ticket par ticket.
6. Exposez votre propre documentation Swagger sur `/api`.
7. Rédigez votre rapport de veille (`rapport-veille-back.pdf`) et un README détaillé de votre projet final.

## Mon implémentation : NestJS

J'ai choisi NestJS parmi les trois frameworks étudiés. Le comparatif et les raisons de ce choix sont dans [rapport-veille-back.pdf](rapport-veille-back.pdf).

L'API gère des utilisateurs, leurs listes, et les cartes de ces listes. Toutes les routes du contrat sont en place, sauf `GET /api/users/me` (ticket #5, à venir).

## Prérequis

- Node.js 24 et npm 11 ;
- Docker Desktop, qui fournit la base PostgreSQL 17. Un PostgreSQL local fait aussi l'affaire, il suffit d'adapter `DATABASE_URL`.

## Installation et lancement

```bash
docker compose up -d --wait   # démarre PostgreSQL sur le port 5433
npm install
cp .env.example .env          # puis remplacer JWT_SECRET, voir plus bas
npm run prisma:generate       # génère le client Prisma
npm run db:deploy             # applique les migrations, donc crée les tables
npm run start:dev             # API sur http://localhost:3000
```

Pour une exécution sans rechargement à chaud : `npm run build` puis `npm run start:prod`.

Docker ne sert qu'à la base de données. Le conteneur contient deux bases : `kanban` pour le développement et `kanban_test` pour les tests.

## Variables d'environnement

Elles se règlent dans le fichier `.env`, copié depuis `.env.example`.

| Variable | Rôle | Valeur par défaut |
| --- | --- | --- |
| `DATABASE_URL` | Connexion à PostgreSQL | celle du conteneur Docker |
| `JWT_SECRET` | Secret qui signe les jetons, 16 caractères minimum | aucune, à générer |
| `JWT_EXPIRES_IN` | Durée de vie d'un jeton | `1h` |
| `PORT` | Port de l'API | `3000` |

Pour générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Les variables sont vérifiées au démarrage. S'il en manque une, ou si la base est injoignable, l'API refuse de démarrer et dit pourquoi.

## Documentation Swagger

- Interface : http://localhost:3000/api
- Document OpenAPI généré : http://localhost:3000/api-json

Pour essayer une route protégée : créer un compte avec `POST /api/auth/register`, se connecter avec `POST /api/auth/login`, copier l'`accessToken`, puis le coller dans le bouton **Authorize**.

La documentation générée reprend le contrat et y ajoute les réponses 400 que les tickets demandent mais que `openapi.yaml` ne liste pas.

## Base de données

Pour voir et modifier les données dans le navigateur, Prisma Studio :

```bash
npm run db:studio   # ouvre http://localhost:51212, adresse rappelée dans le terminal
```

Les autres commandes Prisma :

```bash
npm run db:deploy         # applique les migrations existantes
npm run db:migrate        # crée une migration après une modification de prisma/schema.prisma
npm run prisma:generate   # régénère le client Prisma
npm run db:reset          # repart d'une base vide : toutes les données sont effacées
```

Pour interroger la base en SQL, directement dans le conteneur :

```bash
docker exec -it kanban-db psql -U kanban -d kanban
```

Une fois dans `psql` : `\dt` liste les tables, `SELECT * FROM "List";` affiche les listes, `\q` quitte. Les noms de tables prennent une majuscule et des guillemets, comme dans le schéma Prisma.

## Tests

```bash
npm test               # tests unitaires
npm run test:e2e       # tests de bout en bout
npm run test:e2e:cov   # les mêmes, avec la couverture
```

Les tests de bout en bout lancent l'application complète et passent par de vraies requêtes HTTP. Ils utilisent la base `kanban_test`, vidée avant chaque test, donc les données de développement ne bougent pas.

Chaque critère d'acceptation des tickets a son test, refus compris. Deux utilisateurs, Alice et Bob, servent à vérifier qu'on ne touche jamais aux données de l'autre.

## Tout vérifier

À lancer depuis la racine du projet, dans cet ordre :

```bash
docker compose up -d --wait   # la base doit tourner pour les tests de bout en bout
npm run lint                  # analyse du code avec oxlint
npm run build                 # compilation TypeScript
npm test                      # tests unitaires
npm run test:e2e:cov          # tests de bout en bout, avec la couverture
```

Tout doit passer sans erreur. Le tableau de couverture s'affiche à la fin, fichier par fichier : la Definition of Done demande au moins 80 % par module.

## Choix d'implémentation

### Format des erreurs

Toutes les erreurs ont la forme standard de NestJS. Pour une erreur de validation, `message` est un tableau qui nomme chaque champ fautif :

```json
{ "statusCode": 400, "message": ["title should not be empty"], "error": "Bad Request" }
```

Un champ inconnu dans le corps d'une requête est refusé avec un 400, il n'est pas ignoré en silence.

### 404 ou 403 ?

L'API vérifie d'abord que la ressource existe, ensuite qu'elle m'appartient. Une liste inconnue donne donc un 404, la liste de quelqu'un d'autre un 403 :

```json
{ "statusCode": 404, "message": "List not found", "error": "Not Found" }
```

```json
{ "statusCode": 403, "message": "This list belongs to another user", "error": "Forbidden" }
```

Un 403 révèle donc que la ressource existe. C'est assumé : les tickets demandent un 403 explicite pour les cas de propriété.

Une carte n'a pas de propriétaire propre, elle appartient à celui qui possède sa liste. Pour déplacer une carte, il faut posséder aussi la liste d'arrivée.

### Suppression d'une liste

Supprimer une liste supprime ses cartes. La cascade est déclarée dans le schéma Prisma (`onDelete: Cascade`) et appliquée par PostgreSQL. Une liste n'est jamais refusée à la suppression parce qu'elle contient encore des cartes.

### Comptes et droits

- Un utilisateur ne modifie que son propre profil. Seul un administrateur peut modifier un autre compte ou changer un rôle.
- L'inscription crée toujours un compte `user`. Un administrateur se crée directement en base.
- Un email déjà utilisé donne un 409.

### Mots de passe et jetons

- Les mots de passe sont hachés avec bcrypt et ne sortent jamais de l'API : Prisma est configuré pour écarter le champ `password` de toutes les réponses.
- À la connexion, le message d'erreur est le même que l'email soit inconnu ou le mot de passe faux, pour ne pas indiquer quels comptes existent.
- Le jeton JWT ne contient que l'identifiant de l'utilisateur (`sub`) et expire au bout d'une heure. L'utilisateur est relu en base à chaque requête : un compte supprimé ou un rôle modifié prend effet tout de suite.

### Autres détails

- Les identifiants sont des UUID v7, donc des chaînes, comme le prévoit le contrat.
- Un champ optionnel peut être absent mais pas `null`. Seule exception : la `description` d'une carte, où `null` sert à la vider.
- Les listes et les cartes sont renvoyées triées par `position`.

## Structure du projet

```text
src/
  auth/     inscription, connexion, garde JWT
  users/    modification d'un utilisateur
  lists/    listes
  cards/    cartes
  prisma/   accès à la base, conversion des erreurs Prisma en 404 ou 409
  config/   validation des variables d'environnement
test/       tests de bout en bout et leurs helpers
prisma/     schéma et migrations
docker/     script de création de la base de test
```

Chaque domaine suit le découpage habituel de NestJS : un module, un contrôleur pour les routes, un service pour la logique, des DTO pour valider les entrées et décrire les sorties.

## Organisation du travail

Le backlog est suivi dans un GitHub Project, une issue par ticket. Chaque ticket est développé sur une branche créée depuis son issue, puis fusionné par une pull request qui ferme l'issue. Les tickets d'un même domaine, listes ou cartes, partagent une branche, avec un commit par ticket.
