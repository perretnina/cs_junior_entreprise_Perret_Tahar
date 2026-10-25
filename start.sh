#!/bin/bash

set -e

echo "Démarrage de Junior-Entreprise..."

docker compose up --build -d

echo ""
echo "Attente du démarrage de l'application..."

until curl --silent --fail http://localhost:3000/health > /dev/null; do
    sleep 1
done

until curl --silent --fail http://localhost:5173 > /dev/null; do
    sleep 1
done

echo ""
echo "========================================"
echo "  Junior-Entreprise ISMIN"
echo ""
echo "  Application prête !"
echo "  → http://localhost:5173"
echo "========================================"
echo ""