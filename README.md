# Airzone Cloud WebSocket Logger

Cette application Node.js permet de se connecter à Airzone Cloud et de surveiller en temps réel tous les événements arrivant sur le WebSocket.

## Fonctionnalités

1. Authentification à l'API Airzone Cloud
2. Récupération des dernières notifications
3. Connexion au WebSocket et affichage des événements en temps réel

## Installation

```bash
npm install
```

## Configuration

Avant d'utiliser l'application, vous devez configurer vos identifiants Airzone Cloud dans le fichier `data/configuration.json`:

```json
{
  "airzone": {
    "email": "votre_email@exemple.com", 
    "password": "votre_mot_de_passe"
  },
  "logLevel": "info"
}
```

## Utilisation

Pour lancer l'application :

```bash
npm start
```

L'application va :

1. Se connecter à Airzone Cloud avec les identifiants fournis
2. Récupérer et afficher les dernières notifications
3. Se connecter au WebSocket et afficher tous les événements reçus

Pour arrêter l'application, appuyez sur `Ctrl+C`.

## Structure du code

- `index.js`: Point d'entrée de l'application qui orchestre les différentes étapes
- `data/configuration.json`: Fichier de configuration pour stocker les identifiants

## Dépendances

- `ws`: Client WebSocket pour la connexion en temps réel
- `@sbesson/configuration-loader`: Chargeur de configuration
