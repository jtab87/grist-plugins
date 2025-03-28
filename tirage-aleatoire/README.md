# Tirage aléatoire

Permet d'effectuer un tirage aléatoire de x (ou x%) lignes dans une table GRIST.

Il faut associer la table GRIST à ce plugin, et ajouter une colonne technique (type texte) pour mémoriser la sélection de la ligne (Une ligne sélectionnée recevra 'ok' dans ce champ). 

Cette colonne technique sera identifiée dans la configuration (<i>"Enregistrer le tirage dans"</i>)

Il suffira ensuite de poser un filtre sur cette colonne (filtre sur la valeur 'ok') pour récupérer les lignes retenues.
