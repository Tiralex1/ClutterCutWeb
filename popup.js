/**
 * ==========================================================================
 * CLUTTERCUTWEB - LOGIQUE DE L'INTERFACE (POPUP)
 * Projet : Platon Formation
 * Description : Gestion des interactions utilisateur, navigation entre les vues
 * et communication avec le script de contenu (content.js).
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. SÉLECTION DES ÉLÉMENTS DOM
  // ==========================================================================

  // --- Vues (Écrans) ---
  const viewHome = document.getElementById('view-home');
  const viewSettings = document.getElementById('view-settings');

  // --- Navigation ---
  const btnManage = document.getElementById('btn-manage');
  const btnBackHome = document.getElementById('btn-back-home');

  // --- Contrôles de l'Accueil (Vue 1) ---
  const masterToggle = document.getElementById('masterToggle');     // Switch On/Off site
  const masterContainer = document.getElementById('masterContainer');
  const masterLabel = document.getElementById('masterLabel');
  
  const btnCleaner = document.getElementById('btn-cleaner');        // Mode Masquer
  const btnResizer = document.getElementById('btn-resizer');        // Mode Taille
  const toggleVisBtn = document.getElementById('toggleVisibility'); // Switch Voir Masqués

  // --- Contrôles des Paramètres (Vue 2) ---
  const sitesList = document.getElementById('sitesList');
  const initResetBtn = document.getElementById('initResetBtn');         // Bouton Reset initial
  const confirmResetBlock = document.getElementById('confirmResetBlock'); // Bloc de confirmation
  const confirmResetBtn = document.getElementById('confirmReset');      // Bouton OUI
  const cancelResetBtn = document.getElementById('cancelReset');        // Bouton NON


  // ==========================================================================
  // 2. FONCTIONS UTILITAIRES & COMMUNICATION
  // ==========================================================================

  /**
   * Envoie un message au script de contenu de l'onglet actif.
   * @param {Object} message - L'objet contenant l'action et les données.
   * @param {Function} callback - Fonction optionnelle à exécuter avec la réponse.
   */
  function sendMessage(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
             if (callback) callback(response);
        }).catch(() => {
          // Gestion silencieuse des erreurs (ex: extension ouverte sur une page système)
        });
      }
    });
  }

  /**
   * Met à jour l'état visuel des boutons en fonction du Master Switch.
   * @param {boolean} isActive - Si l'extension est active sur ce site.
   */
  function updateUIState(isActive) {
    if (isActive) {
      masterContainer.classList.remove('disabled');
      masterLabel.textContent = "Activé sur ce site";
      btnCleaner.disabled = false;
      btnResizer.disabled = false;
      toggleVisBtn.disabled = false;
    } else {
      masterContainer.classList.add('disabled');
      masterLabel.textContent = "Désactivé sur ce site";
      btnCleaner.disabled = true;
      btnResizer.disabled = true;
      toggleVisBtn.disabled = true;
    }
  }


  // ==========================================================================
  // 3. INITIALISATION (AU CHARGEMENT)
  // ==========================================================================

  // Demande l'état actuel (On/Off et Visibilité) au Content Script
  sendMessage({ action: "get_status" }, (response) => {
    if (response) {
      // 1. Mise à jour du Master Switch
      if (typeof response.isActive !== 'undefined') {
        masterToggle.checked = response.isActive;
        updateUIState(response.isActive);
      }
      
      // 2. Mise à jour du Switch "Voir Masqués" (Persistance de l'état)
      if (typeof response.visibilityState !== 'undefined') {
        toggleVisBtn.checked = response.visibilityState;
      }
    }
  });


  // ==========================================================================
  // 4. GESTION DE LA NAVIGATION (VUES)
  // ==========================================================================

  // Aller vers les paramètres
  btnManage.addEventListener('click', () => {
    viewHome.style.display = 'none';
    viewSettings.style.display = 'flex'; 
    renderSitesList(); // Rafraîchir la liste à l'ouverture
  });

  // Retour à l'accueil
  btnBackHome.addEventListener('click', () => {
    viewSettings.style.display = 'none';
    viewHome.style.display = 'flex';
  });


  // ==========================================================================
  // 5. GESTION DES ACTIONS PRINCIPALES
  // ==========================================================================

  // --- Master Switch (Activer/Désactiver sur le site) ---
  masterToggle.addEventListener('change', (e) => {
    const isActive = e.target.checked;
    updateUIState(isActive);
    sendMessage({ action: "toggle_site_active", state: isActive });
  });

  // --- Bouton Mode Masquer ---
  btnCleaner.addEventListener('click', () => {
    if (!masterToggle.checked) return;
    
    toggleVisBtn.checked = false; 
    
    sendMessage({ action: "activate_mode", mode: "cleaner" });
    window.close();
  });

  // --- Bouton Mode Taille ---
  btnResizer.addEventListener('click', () => {
    if (!masterToggle.checked) return;
    
    toggleVisBtn.checked = false;
    
    sendMessage({ action: "activate_mode", mode: "resizer" });
    window.close();
  });

  // --- Switch Voir les éléments masqués ---
  toggleVisBtn.addEventListener('change', (e) => {
    if (!masterToggle.checked) return;
    sendMessage({ action: "toggle_visibility", state: e.target.checked });
  });


  // ==========================================================================
  // 6. GESTION DES PARAMÈTRES & RESET
  // ==========================================================================

  // Afficher la confirmation de reset
  initResetBtn.addEventListener('click', () => {
    initResetBtn.style.display = 'none';
    confirmResetBlock.style.display = 'block';
    // Scroll auto vers le bas pour voir les boutons
    const listContainer = document.querySelector('.list-container');
    listContainer.scrollTop = listContainer.scrollHeight;
  });

  // Annuler le reset
  cancelResetBtn.addEventListener('click', () => {
    confirmResetBlock.style.display = 'none';
    initResetBtn.style.display = 'block';
  });

  // Confirmer le reset global
  confirmResetBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
      renderSitesList();
      sendMessage({ action: "reload_rules" });
      
      // Feedback visuel de succès
      confirmResetBlock.innerHTML = '<p style="color:green; margin:0; font-weight:bold;">Succès !</p>';
      
      setTimeout(() => {
        confirmResetBlock.style.display = 'none';
        initResetBtn.style.display = 'block';
        
        // Restauration du HTML initial pour la prochaine fois
        // (Nécessaire car on a écrasé le contenu avec le message de succès)
        confirmResetBlock.innerHTML = `
            <p class="confirm-text">Voulez-vous tout effacer ?</p>
            <div class="confirm-buttons">
              <button id="cancelReset" class="btn-cancel">Non</button>
              <button id="confirmReset" class="btn-confirm">OUI</button>
            </div>
        `;
        
        // Ré-attacher les événements aux nouveaux éléments DOM créés
        document.getElementById('cancelReset').onclick = () => {
             confirmResetBlock.style.display = 'none';
             initResetBtn.style.display = 'block';
        };
        // Réutilisation récursive de la fonction actuelle
        document.getElementById('confirmReset').onclick = confirmResetBtn.onclick;
        
        window.location.reload(); // Rafraîchir la popup pour être propre
      }, 1000);
    });
  });


  // ==========================================================================
  // 7. GESTION DE LA LISTE DES SITES
  // ==========================================================================

  /**
   * Récupère les données du stockage et affiche la liste des sites modifiés.
   */
  function renderSitesList() {
    chrome.storage.local.get(null, (items) => {
      sitesList.innerHTML = ''; // Nettoyage
      const rawKeys = Object.keys(items);
      const uniqueSites = new Set();
      
      // Filtrage : on ne garde que les noms de domaine ayant des règles
      rawKeys.forEach(key => {
        if (key.startsWith('hidden_')) uniqueSites.add(key.replace('hidden_', ''));
        else if (key.startsWith('resized_')) uniqueSites.add(key.replace('resized_', ''));
      });

      // Cas vide
      if (uniqueSites.size === 0) {
        sitesList.innerHTML = '<div class="empty-msg">Aucun site configuré.</div>';
        return;
      }

      // Génération des éléments de liste
      uniqueSites.forEach(site => {
        const li = document.createElement('li');
        li.className = 'site-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = site;
        nameSpan.title = site; // Tooltip si le nom est coupé
        
        const delBtn = document.createElement('span');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '✕';
        delBtn.title = 'Supprimer les réglages pour ce site';
        
        // Suppression d'un site spécifique
        delBtn.onclick = () => {
          chrome.storage.local.remove([`hidden_${site}`, `resized_${site}`, `status_${site}`], () => {
            renderSitesList(); // Rafraîchir la liste
            // Recharger la page si on est sur le site concerné
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
               if (tabs[0].url.includes(site) || decodeURIComponent(tabs[0].url).includes(site)) {
                 chrome.tabs.reload(tabs[0].id);
               }
            });
          });
        };

        li.appendChild(nameSpan); 
        li.appendChild(delBtn);
        sitesList.appendChild(li);
      });
    });
  }
});