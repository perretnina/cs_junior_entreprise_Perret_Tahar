# Projet Web Junior-Entreprise - **RAPPORT PRODUIT**

# Lien vers le fil:
https://github.com/gaetanmaisse/ismin-web-2026-tps/discussions/11

## 1. Le besoin

#### Le besoin du client était de **ne pas perdre de données d'un mandat sur l'autre**.

Ceci se déclinait en deux axes :

1. Permettre aux membres du bureau de suivre l'activité de la junior, autrement dit les missions/prospects/intervenants, sans perdre de données entre les années lorsque les membres du bureau changent. 

2. Permettre aux intervenants de suivre les missions auxquelles ils participent, sans perdre la trace de qui fait quoi dès que le bureau change.


#### Le client n'avait exprimé son besoin que de manière partielle lors de son premier message:

"Bonjour, Mathis, président de la junior-entreprise. On réalise des missions d'informatique et d'électronique pour des entreprises. Les prospects, les devis, les élèves sur chaque mission : tout est dans des tableurs, et chaque année, quand le bureau change, on perd tout."


Ce premier message ne distingait pas les **membres du bureau** et les **intervenants**. Pourtant, cette distinction est essentielle, car ces deux catégories ne doivent pas pouvoir accéder aux mêmes informations (même si fondamentalement le but est le même : éviter la perte d'informations). 
--> Les utilisateurs peuvent donc être soit des membres du bureau soit des intervenants (voir journal de décisions pour le détail de l'implementation que nous avons effectuée).

#### Dans le reste de la discussion, voici quelques éléments qui nous ont guidées dans la construction du projet :

En ce qui concerne la prospection, le client a exprimé le besoin d'éviter de reproposer une mission à un client qui a déjà refusé. 
--> Cela sous entendait la nécessité de mettre en place des statuts (en cours, pas intéressé, à recontacter, à fidéliser, pas encore contacté).


De même, les missions se déroulent en suivant différentes étapes.
--> Idem, il fallait labelliser les missions par des statuts (devis, signée, facture d'accompte émise, accompte payé, en cours, facture de solde émise, solde payé, terminée).


Enfin, la date de fin de scolarité des intervenants est un élément à considérer pour l'affectation des missions. --> D'où la nécessité de bloquer les intervenants "non compatibles" lorsqu'on créé ou qu'on modifie une mission. 

## 2. Les trois fonctionnalités

Les trois fonctionnalités qui ont été déterminés lors du cadrage sont les suivantes :

1. Suivi de la prospection en cours 
2. Suivi de l'état d'avancement des missions
3. Suivi des KPI pertinents pour la junior

Le bureau de l'année en cours a accès à tout tandis que les intervenants ne voient que les missions auxquelles ils sont affectés, sans leur prix. Il a donc fallu bien distinguer les deux rôles pour que chacun n'ait accès qu'aux informations auxquelles il a le droit.

Quelques remarques dont il a fallu tenir compte, issues de la discussion avec le client :
- Plusieurs intervenants peuvent être affectés à une mission.
- Un intervenant doit être scolarisé pendant toute la durée d'une mission.
- En ce qui concerne le renouvellement du bureau, les membres sortants perdent leur accès en janvier et les membres entrants accèdent à toutes les données.

Nous avons dû tenir compte de ces contraintes lors du développement des trois fonctionnalités.

### Ce que nous avons coupé 
#TODO

## 3. Le journal de décisions

Cinq à dix entrées :

- Ce que vous avez choisi.
- Ce que vous avez écarté.
- Pourquoi.
- Chaque entrée renvoie à un commit.

### - La page d'accueil : distinction entre les deux rôles possibles

Dès la page d'accueil, l'utilisateur doit choisir son rôle : utilisateur ou intervenant. Il y a donc deux pages de connexion respectives. 

Un intervenant ne peut pas accéder à toutes les données, contrairement aux membres du bureau. 

Dans le cas où un utilisateur possède les deux rôles, il peut se connecter aux deux avec le même identifiant de connexion. Mais attention, il doit forcément choisir avec quel rôle il souhaite se connecter (intervenant ou bureau), ce qui le redirige vers la page de login associée. Une page de connexion unique pour les deux rôles aurait conduit à un conflit dans ce cas. 

Remarque : On aurait également pu imposer deux comptes distints pour un utilisateur qui possède les deux rôles, mais en pratique les intervenants utilisent leur adresse mail etudiante... donc c'est moins pratique. Avec du recul, un identifiant de connexion autre que l'email aurait aussi pu être envisageable.

Commits associés : 

- 39c13c7 feat(auth): implement JWT authentication and role-based access

- 48a9ca4 fix: correct access permissions (un bureau+intervenant ne voyait jamais son espace intervenant )


### -  Authentification :

N'importe qui ne peut pas créer un compte et accéder aux données. Les comptes sont créés par l'administrateur, depuis le dossier *backend* avec la commande ```npm run user:create```. Dans le cadre du projet, une série d'identifiants par défaut sont disponible sur le fichier */backend/test-data/test-credentials.local.example.json* pour éviter d'avoir à créer un compte.

On aurait pu faire un onglet spécialement dédié à la passation, permettant de créer les comptes des membres du prochain bureau. Nous avons écarté cette option car ça faisait ajouter une fonctionnalité supplémentaire pour une tâche n'ayant lieu qu'une fois par an et concernant seulement quelques personnes : c'est assez rapide à faire par l'administrateur. 

Commit associé : 39c13c7 feat(auth): implement JWT authentication and role-based acces.

### Validation des missions dans le backend pour empêcher les erreurs d'origine humaine :

Commit associé : 6956797 feat: implement bureau management interface and KPI dashboard

## 4. L'IA, écartée

Voici une des propositions de l'IA que nous avons écartée :

"Il faut créer une base PostgreSQL dédiée aux tests d’intégration du backend, par exemple : junior_entreprise_test."

Or, notre base de données fait déjà office de base de données de test. Les données qui y figurent ne sont pas des vraies données : elles ont été saisies de manière arbitraire, pour tester notre projet. Effectuer des tests sur ces dernières n'était donc pas problématiques, au contraire, elles sont faites pour ça. 

Dans un cas concret en entreprise, créer une base de données spécialement dédiée aux tests peut être pertinent, mais ce n'était pas le cas dans le cadre de notre projet. On aurait obtenu "deux bases de données de tests". C'est pourquoi nous avons écarté cette proposition.