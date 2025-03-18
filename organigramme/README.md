# Organigramme
Permet de connecter un organigramme sur une table GRIST

Utilise : 

- d3js.org/d3.v7
- d3-org-chart@3.0.1
- d3-flextree@2.1.2/build/d3-flextree.js

## le plugin

![écran0](../images/org0.png)

- Zoom +/- à la souris
- Ouverture / fermeture des noeuds
- Déplacement de l'organigramme par glisser / tirer
- Recherche sur le nom
- Visualisation du parcours entre l'agent et le numéro 1 de l'organigramme en cliquant sur l'identifiant (#xx)
- Modification du titre et de la vignette (enregistrer le widget après modification)

## la confguration

![écran0](../images/org2.png)

![écran0](../images/org3.png)

> **Attention** : poser un filtre sur le plugin peut empécher l'organigramme de fonctionner.

## Ajouter le plugin
 - Vérifiez que la table comporte un champ parentId qui retourne l'id du n+1
 - Ajouter un plugin personnalisé (de type **url personnalisée**) à votre page, et associez le à la table contenant les salariés
 - Utilisez l'URL : https://jtab87.github.io/grist-plugins/organigramme/
 - Configurez

