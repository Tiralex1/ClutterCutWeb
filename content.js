/**
 * ==========================================================================
 * CLUTTERCUTWEB - SCRIPT DE CONTENU (CONTENT SCRIPT)
 * Projet : Platon Formation
 * Description : Ce script est injecté dans les pages web. Il gère la sélection
 * des éléments, l'application du CSS (masquage/zoom) et l'interface in-page.
 * ==========================================================================
 */

// ==========================================================================
// 1. CONFIGURATION & ÉTAT GLOBAL
// ==========================================================================

// État de l'application
let currentMode = null;      // 'cleaner', 'resizer', ou null
let showHiddenItems = false; // Si true, on affiche les éléments masqués en transparence
let isSiteActive = true;     // Si false, l'extension est désactivée sur ce site

// Références UI (pour suppression facile)
let activeToolbar = null;    // La barre d'outils de zoom
let activeBadge = null;      // Le badge "Mode X" en bas de page

// Identification du site (Domaine ou Fichier local)
function getSiteId() {
  if (window.location.protocol === 'file:') {
    return decodeURIComponent(window.location.pathname);
  }
  return window.location.hostname;
}

const siteId = getSiteId();

// Clés de stockage LocalStorage
const KEY_HIDDEN = "hidden_" + siteId;
const KEY_RESIZED = "resized_" + siteId;
const KEY_STATUS = "status_" + siteId;


// ==========================================================================
// 2. FONCTIONS UTILITAIRES
// ==========================================================================

/**
 * Génère un sélecteur CSS unique et robuste pour un élément DOM donné.
 * Remonte l'arbre DOM pour créer un chemin précis (ex: "div#main > ul > li:nth-of-type(2)").
 */
function getCssPath(el) {
  if (!(el instanceof Element)) return;
  const path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
      path.unshift(selector);
      break; // L'ID est supposé unique, on arrête la remontée
    } else {
      let sib = el, nth = 1;
      while (sib = sib.previousElementSibling) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(" > ");
}


// ==========================================================================
// 3. LOGIQUE CŒUR (APPLICATION DES RÈGLES)
// ==========================================================================

/**
 * Initialisation au chargement de la page.
 * Vérifie si le site est actif avant d'appliquer les règles.
 */
function init() {
  chrome.storage.local.get([KEY_STATUS], (result) => {
    // Par défaut, le site est actif si la clé n'existe pas
    if (typeof result[KEY_STATUS] !== 'undefined') {
      isSiteActive = result[KEY_STATUS];
    } else {
      isSiteActive = true; 
    }
    applyAllRules();
  });
}

/**
 * Orchestrateur principal : applique masquage et redimensionnement.
 */
function applyAllRules() {
  if (!isSiteActive) {
    removeStyles();
    resetZooms();
    setMode(null); // Force la sortie de tout mode d'édition
    return;
  }
  applyHiddenRules();
  applyResizedRules();
}

/**
 * Supprime la balise <style> injectée par l'extension.
 */
function removeStyles() {
  const oldStyle = document.getElementById('tabula-hidden-style');
  if (oldStyle) oldStyle.remove();
}

/**
 * Réinitialise le zoom sur tous les éléments modifiés.
 */
function resetZooms() {
  const zoomedElements = document.querySelectorAll('[data-tabula-scale]');
  zoomedElements.forEach(el => {
    el.style.zoom = ""; 
  });
}

/**
 * Récupère les sélecteurs masqués et injecte le CSS approprié.
 * Gère deux états visuels : Masqué (display:none) ou Fantôme (pour restauration).
 */
function applyHiddenRules() {
  chrome.storage.local.get([KEY_HIDDEN], (result) => {
    const selectors = result[KEY_HIDDEN] || [];
    removeStyles();

    if (selectors.length > 0) {
      const style = document.createElement('style');
      style.id = 'tabula-hidden-style';
      
      if (showHiddenItems) {
        // MODE RESTAURATION : On affiche les éléments avec un style distinct (Vert)
        // pointer-events: auto est crucial pour permettre le clic de restauration
        style.textContent = selectors.join(', ') + ' { \
            display: block !important; \
            opacity: 0.6 !important; \
            outline: 2px dashed #27ae60 !important; \
            background-color: rgba(39, 174, 96, 0.1) !important; \
            pointer-events: auto !important; \
            cursor: alias !important; \
            transition: all 0.3s; \
        }';
      } else {
        // MODE NORMAL : On cache les éléments
        style.textContent = selectors.join(', ') + ' { display: none !important; }';
      }
      document.head.appendChild(style);
    }
  });
}

/**
 * Applique les zooms sauvegardés via la propriété CSS `zoom`.
 */
function applyResizedRules() {
  chrome.storage.local.get([KEY_RESIZED], (result) => {
    const resizedData = result[KEY_RESIZED] || {};
    for (const [selector, scale] of Object.entries(resizedData)) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.zoom = scale; 
        el.dataset.tabulaScale = scale; // Marqueur pour reset futur
      });
    }
  });
}


// ==========================================================================
// 4. INTERFACE UTILISATEUR (IN-PAGE)
// ==========================================================================

/**
 * Affiche la barre d'outils flottante pour le redimensionnement.
 */
function showResizeToolbar(targetElement, selector) {
  if (activeToolbar) activeToolbar.remove();
  
  const toolbar = document.createElement('div');
  toolbar.id = 'tabula-toolbar';
  
  // Calcul de la position (au-dessus de l'élément)
  const rect = targetElement.getBoundingClientRect();
  const topPos = window.scrollY + rect.top - 45;
  const leftPos = window.scrollX + rect.left;

  Object.assign(toolbar.style, {
    position: 'absolute', top: Math.max(0, topPos) + 'px', left: leftPos + 'px',
    zIndex: '2147483647', background: '#34495e', padding: '6px 12px', borderRadius: '40px',
    display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontFamily: 'sans-serif'
  });

  let currentZoom = parseFloat(targetElement.style.zoom) || 1;

  // Création générique de bouton
  const createBtn = (label, bg, onClick) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, { background: bg, color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    btn.onclick = (e) => { e.stopPropagation(); onClick(); };
    return btn;
  };

  // Logique de mise à jour du zoom
  const updateZoom = (newZoom) => {
    if (newZoom < 0.2) newZoom = 0.2; if (newZoom > 5) newZoom = 5;
    newZoom = Math.round(newZoom * 10) / 10;
    
    currentZoom = newZoom; 
    targetElement.style.zoom = currentZoom; 
    targetElement.dataset.tabulaScale = currentZoom;
    textDisplay.textContent = Math.round(currentZoom * 100) + '%';
    
    // Sauvegarde immédiate
    chrome.storage.local.get([KEY_RESIZED], (res) => {
      const data = res[KEY_RESIZED] || {};
      if (currentZoom === 1) delete data[selector]; else data[selector] = currentZoom;
      chrome.storage.local.set({ [KEY_RESIZED]: data });
    });
  };

  // Assemblage de la barre
  toolbar.appendChild(createBtn("-", "#e74c3c", () => updateZoom(currentZoom - 0.1)));
  
  const textDisplay = document.createElement('span'); 
  textDisplay.textContent = Math.round(currentZoom * 100) + '%'; 
  Object.assign(textDisplay.style, { color: 'white', fontSize: '12px', minWidth: '40px', textAlign: 'center' }); 
  toolbar.appendChild(textDisplay);
  
  toolbar.appendChild(createBtn("+", "#2ecc71", () => updateZoom(currentZoom + 0.1)));
  
  const closeBtn = document.createElement('span'); 
  closeBtn.textContent = "✕"; 
  Object.assign(closeBtn.style, { marginLeft: '10px', color: '#95a5a6', cursor: 'pointer', fontSize: '12px' }); 
  closeBtn.onclick = (e) => { e.stopPropagation(); toolbar.remove(); activeToolbar = null; }; 
  toolbar.appendChild(closeBtn);

  document.body.appendChild(toolbar); 
  activeToolbar = toolbar;
}


// ==========================================================================
// 5. GESTION DES ÉVÉNEMENTS (SOURIS & CLICS)
// ==========================================================================

function handleMouseOver(e) {
  // En mode "Voir Masqués", le curseur est géré par CSS (cursor: alias), pas besoin de JS ici
  if (showHiddenItems) return;
  if (!currentMode) return;
  
  e.stopPropagation();
  // Protection : Ne pas cibler l'UI de l'extension
  if (activeToolbar && activeToolbar.contains(e.target)) return;
  if (activeBadge && activeBadge.contains(e.target)) return;

  if (currentMode === 'cleaner') {
    e.target.style.outline = "3px solid #e74c3c"; // Rouge
    e.target.style.cursor = "pointer";
  } else if (currentMode === 'resizer') {
    e.target.style.outline = "3px solid #9b59b6"; // Violet
    e.target.style.cursor = "zoom-in";
  }
}

function handleMouseOut(e) {
  if (showHiddenItems) return;
  if (!currentMode) return;
  
  e.stopPropagation();
  e.target.style.outline = "";
  e.target.style.cursor = "";
}

function handleClick(e) {
  // Protection : Ignorer les clics sur nos propres barres d'outils/badges
  if (activeToolbar && activeToolbar.contains(e.target)) return;
  if (activeBadge && activeBadge.contains(e.target)) return;

  // --- A. MODE RESTAURATION (SI ACTIF) ---
  if (showHiddenItems) {
    e.preventDefault();
    e.stopPropagation();
    
    let target = e.target;
    let selector = getCssPath(target);
    
    // Logique intelligente : Si on clique sur un enfant d'un bloc masqué,
    // on doit retrouver le parent qui est réellement dans la liste des masqués.
    chrome.storage.local.get([KEY_HIDDEN], (result) => {
        let selectors = result[KEY_HIDDEN] || [];
        let foundSelector = null;
        
        // 1. Vérification directe
        if (selectors.includes(selector)) {
            foundSelector = selector;
        } else {
            // 2. Remontée vers les parents
            let currentEl = target.parentElement;
            while (currentEl && currentEl.nodeName !== 'BODY') {
                let parentSelector = getCssPath(currentEl);
                if (selectors.includes(parentSelector)) {
                    foundSelector = parentSelector;
                    break;
                }
                currentEl = currentEl.parentElement;
            }
        }

        if (foundSelector) {
            // Suppression de la liste noire
            selectors = selectors.filter(s => s !== foundSelector);
            chrome.storage.local.set({ [KEY_HIDDEN]: selectors }, () => {
                applyHiddenRules(); // L'élément redevient visible
            });
        }
    });
    return; // Arrêt du traitement ici
  }

  // --- B. MODE ÉDITION (CLEANER OU RESIZER) ---
  if (!currentMode) return;

  e.preventDefault();
  e.stopPropagation();

  const target = e.target;
  const selector = getCssPath(target);

  if (currentMode === 'cleaner') {
    // Ajout à la liste noire
    chrome.storage.local.get([KEY_HIDDEN], (result) => {
      let selectors = result[KEY_HIDDEN] || [];
      if (!selectors.includes(selector)) {
        selectors.push(selector);
        chrome.storage.local.set({ [KEY_HIDDEN]: selectors }, () => applyHiddenRules());
      }
    });
  } 
  else if (currentMode === 'resizer') {
    // Affichage de la toolbar
    showResizeToolbar(target, selector);
  }
}


// ==========================================================================
// 6. GESTION DES MODES (ACTIVATION / DÉSACTIVATION)
// ==========================================================================

function setMode(mode) {
  currentMode = mode;
  
  // Nettoyage de l'interface précédente
  if (activeToolbar) { activeToolbar.remove(); activeToolbar = null; }
  if (activeBadge) { activeBadge.remove(); activeBadge = null; }
  
  // Reset des outlines visuels (sauf si mode restauration)
  document.querySelectorAll('*').forEach(el => {
      if(!showHiddenItems) el.style.outline = "";
  });

  if (currentMode) {
    // Activation des écouteurs
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, true);

    // Création du Badge "Terminer" en bas de page
    const badge = document.createElement('div'); 
    badge.id = 'tabula-badge';
    Object.assign(badge.style, { position: 'fixed', bottom: '20px', right: '20px', padding: '8px 12px', background: currentMode === 'cleaner' ? "#e74c3c" : "#9b59b6", color: 'white', zIndex: '2147483647', borderRadius: '50px', fontWeight: 'bold', fontFamily: 'Segoe UI, sans-serif', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '15px', pointerEvents: 'auto' });
    
    const label = document.createElement('span'); 
    label.textContent = currentMode === 'cleaner' ? "MODE MASQUER" : "MODE TAILLE"; 
    badge.appendChild(label);
    
    const stopBtn = document.createElement('button'); 
    stopBtn.textContent = "Terminer"; 
    Object.assign(stopBtn.style, { background: 'white', color: currentMode === 'cleaner' ? "#e74c3c" : "#9b59b6", border: 'none', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase' });
    
    stopBtn.onclick = (e) => { e.stopPropagation(); setMode(null); }; 
    badge.appendChild(stopBtn); 
    
    document.body.appendChild(badge); 
    activeBadge = badge;

  } else {
    // Désactivation des écouteurs d'édition
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    
    // IMPORTANT : Si showHiddenItems est actif, on doit laisser le 'click' actif pour la restauration
    if (!showHiddenItems) {
        document.removeEventListener('click', handleClick, true);
    }
  }
}


// ==========================================================================
// 7. SYSTÈME DE MESSAGERIE (POPUP <-> CONTENT)
// ==========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // A. Demande d'état initial par la popup
  if (request.action === "get_status") {
    sendResponse({ isActive: isSiteActive, visibilityState: showHiddenItems });
  }
  
  // B. Toggle On/Off global sur le site
  else if (request.action === "toggle_site_active") {
    isSiteActive = request.state;
    chrome.storage.local.set({ [KEY_STATUS]: isSiteActive }, () => {
      applyAllRules();
    });
  }
  
  // C. Activation d'un mode (Cleaner / Resizer)
  else if (request.action === "activate_mode") {
    if (!isSiteActive) { alert("Extension désactivée sur ce site."); return; }
    
    // MODIFICATION : Au lieu d'alerter, on désactive automatiquement la vue "Masqués"
    if (showHiddenItems) {
        showHiddenItems = false;
        applyHiddenRules(); // On remet les éléments en "display: none" immédiatement
    }
    
    setMode(request.mode);
  }
  
  // D. Toggle Voir Masqués
  else if (request.action === "toggle_visibility") {
    if (!isSiteActive) return;
    showHiddenItems = request.state;
    
    if (showHiddenItems) {
        setMode(null); // Coupe les modes d'édition
        // Force l'écouteur de clic pour permettre la restauration
        document.addEventListener('click', handleClick, true);
    } else {
        // Coupe l'écouteur de clic (sauf si mode actif)
        if(!currentMode) document.removeEventListener('click', handleClick, true);
    }
    applyHiddenRules();
  }
  
  // E. Reset global
  else if (request.action === "reload_rules") {
    isSiteActive = true; 
    applyAllRules();
    window.location.reload(); 
  }
});

// Lancement initial
init();