# ✂️ ClutterCutWeb - Coupez le désordre du Web

**ClutterCutWeb** est une extension de navigateur qui vous redonne le contrôle sur votre expérience de navigation. Supprimez les publicités, masquez les éléments distrayants, redimensionnez les blocs de texte trop petits, et sauvegardez vos préférences pour chaque site.

> *Projet réalisé dans le cadre du défi de la nuit de l'info Platon Formation - Nettoyez le web comme VOUS l’entendez !*

> *RATP-C (Groupe du projet) - Launay Alexis, Zhu Ruben, Jansen Paul, Colombu Tom*

## ✨ Fonctionnalités

* **🗑 Mode Masquer :** Cliquez sur n'importe quel élément (pub, bannière, menu) pour le faire disparaître définitivement.
* **🔍 Mode Taille :** Agrandissez ou réduisez n'importe quelle zone de la page (texte, image) pour une meilleure lisibilité.
* **👁 Voir & Restaurer :** Affichez les éléments masqués en transparence et **cliquez dessus** pour les restaurer instantanément.
* **⚡️ Gestion par site :** Désactivez l'extension temporairement sur un site spécifique sans perdre vos réglages.
* **⚙️ Panneau de gestion :** Visualisez la liste des sites modifiés et réinitialisez-les individuellement ou globalement.
* **🔒 Respect de la vie privée :** Tout est stocké localement sur votre machine (`Local Storage`). Aucune donnée n'est envoyée vers un serveur.

---

## 🚀 Installation (Mode Développeur)

Comme cette extension est un projet personnel non publié sur les Stores officiels, voici comment l'installer manuellement.

### 1. Préparation
1.  Téléchargez ou créez le dossier contenant le code source de l'extension.
2.  Assurez-vous d'avoir les fichiers suivants : `manifest.json`, `popup.html`, `popup.css`, `popup.js`, `content.js` et le dossier `icons/`.

### 🖥 Sur Google Chrome, Brave, Edge (Chromium)

1.  Ouvrez votre navigateur.
2.  Dans la barre d'adresse, tapez :
    * Chrome : `chrome://extensions`
    * Edge : `edge://extensions`
    * Brave : `brave://extensions`
3.  Activez le **Mode développeur** (bouton ou interrupteur souvent situé en haut à droite).
4.  Cliquez sur le bouton **"Charger l'extension non empaquetée"** (Load unpacked).
5.  Sélectionnez le dossier de votre projet **ClutterCutWeb**.
6.  L'extension est installée !

### 🦊 Sur Mozilla Firefox

1.  Ouvrez Firefox.
2.  Dans la barre d'adresse, tapez : `about:debugging`.
3.  Dans le menu de gauche, cliquez sur **"Ce Firefox"**.
4.  Cliquez sur le bouton **"Charger un module temporaire..."**.
5.  Naviguez dans votre dossier et sélectionnez le fichier **`manifest.json`**.
6.  *Note : Sur Firefox, l'installation via cette méthode est temporaire et disparaîtra au redémarrage complet du navigateur.*

---

## 🛠 Configuration pour les fichiers locaux

Si vous souhaitez utiliser ClutterCutWeb sur vos propres fichiers HTML locaux (adresses commençant par `file://`) :

1.  Allez dans la page de gestion des extensions (`chrome://extensions`).
2.  Cherchez la carte de **ClutterCutWeb**.
3.  Cliquez sur le bouton **"Détails"**.
4.  Activez l'option **"Autoriser l'accès aux URL de fichier"** (Allow access to file URLs).

---

## 📖 Guide d'utilisation

### 1. Masquer un élément indésirable
1.  Cliquez sur l'icône **ClutterCutWeb** dans votre barre d'outils.
2.  Cliquez sur le bouton rouge **"Mode Masquer"**.
3.  Survolez la page : les éléments s'encadrent en rouge.
4.  Cliquez sur l'élément à supprimer. Il disparaît immédiatement.
5.  Cliquez sur le bouton **"Terminer"** en bas de page pour quitter le mode.

### 2. Agrandir ou réduire une zone
1.  Ouvrez l'extension et cliquez sur le bouton violet **"Mode Taille"**.
2.  Cliquez sur la zone à modifier (texte, image...).
3.  Une barre d'outils apparaît : utilisez **[ - ]** et **[ + ]** pour ajuster la taille.
4.  Cliquez sur la croix de la barre d'outils pour valider.

### 3. Restaurer un élément (Annuler une suppression)
1.  Ouvrez l'extension.
2.  Activez l'interrupteur **"Voir les éléments masqués"** en bas du menu.
3.  Les éléments cachés apparaissent en transparence avec une **bordure verte**.
4.  Le curseur se transforme en flèche de restauration (alias).
5.  **Cliquez simplement dessus** pour les restaurer immédiatement.
6.  Désactivez l'interrupteur quand vous avez fini.

### 4. Désactiver sur un site
Vous voulez voir le site normalement sans perdre vos réglages ?
1.  Ouvrez l'extension.
2.  Décochez l'interrupteur principal **"Activé sur ce site"** tout en haut.
3.  La page redevient normale. Recochez pour réappliquer vos filtres.

### 5. Tout réinitialiser
1.  Dans l'extension, cliquez sur le bouton gris **"⚙️ Gérer les sites & Reset"**.
2.  Vous pouvez supprimer un site spécifique via la liste (cliquez sur la croix rouge).
3.  Ou cliquez sur **"Tout réinitialiser (Global)"** en bas pour effacer toutes les données de l'extension.

---

## ⚠️ Dépannage

* **L'extension ne semble pas marcher ?**
    * Avez-vous rechargé la page (F5) après l'installation ?
    * L'interrupteur "Activé sur ce site" est-il bien coché ?
* **Je ne peux pas masquer un élément précis :**
    * Parfois, un élément transparent couvre la zone. Essayez de masquer l'élément parent ou de bouger légèrement la souris.
* **Les fichiers locaux ne sont pas détectés :**
    * Vérifiez l'étape "Configuration pour les fichiers locaux" ci-dessus.

---

## 👨‍💻 Technique

* **Manifest V3** : Respecte les derniers standards de sécurité des navigateurs.
* **Stockage** : Utilise l'API `chrome.storage.local`.
* **CSS Injection** : Utilise des injections de style dynamiques pour un rendu rapide sans clignotement.
* **Compatibilité** : Code universel pour Chrome, Edge, Brave et Firefox.

---

*Développé avec ❤️ pour un web plus propre.*