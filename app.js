// ╔══════════════════════════════════════════════════════════╗
// ║         ZONE DE CONFIGURATION - À MODIFIER              ║
// ╚══════════════════════════════════════════════════════════╝

// ─── EMAILJS CONFIG ───
const EMAILJS_SERVICE_ID  = "service_zxhpp6i";
const EMAILJS_TEMPLATE_ID = "template_m8t8esb";
const EMAILJS_PUBLIC_KEY  = "MRPKM4MGiJMXcUtd0";

const PRODUITS = [
  {
    id: 1,
    type: "exercices",
    titre: "Derivabilité",
    matiere: "Mathématiques",
    niveau: "premiere",
    description: "Ce pdf contient 34 exercices pour vous permettre de vous entraîner et maîtriser complètement la dérivabilité. Les 34 exercices sont aussi corrigés.",
    apercu: "apercu_exercice_maths_derivabilite_1_premiere.pdf",
    prix: 200,
    icon: "📘",
    bg: "#eef2ff",
    lien_pdf: "https://drive.google.com/file/d/1EvATt2Gk0qTjisDWwpbRRAF8D8g9nG-8/view?usp=drivesdk"
  },
  {
    id: 2,
    type: "annales",
    titre: "9 Devoirs",
    matiere: "Mathématiques",
    niveau: "premiere",
    description: "Ce pdf contient 9 devoirs pour vous. N'hésitez pas à les traiter pour connaître votre niveau.",
    apercu: "apercu_devoir_maths_1_premiere.pdf",
    prix: 500,
    icon: "📘",
    bg: "#eef2ff",
    lien_pdf: "https://drive.google.com/file/d/1oEl_b6qANlOu1o8CUAkfhz2L7kxyp7KQ/view?usp=drivesdk"
  },
];

const WHATSAPP_NUM = "22606625715";

let panier = [];

// ─── TOUTES LES FONCTIONS EXPOSÉES GLOBALEMENT ───

window.showPage = function(page) {
  const pages = ['home', 'boutique', 'panier', 'paiement', 'confirmation', 'contact'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(`page-${page}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  if (page === 'home') document.getElementById('btn-home')?.classList.add('active');
  if (page === 'boutique') document.getElementById('btn-boutique')?.classList.add('active');
  if (page === 'contact') document.getElementById('btn-contact')?.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Gérer l'affichage de la page confirmation
  if (page === 'confirmation') {
    const livraison = document.getElementById('f-livraison')?.value;
    const msgEmail = document.getElementById('confirm-msg-email');
    const msgWa    = document.getElementById('confirm-msg-whatsapp');
    if (msgEmail && msgWa) {
      if (livraison === 'email') {
        msgEmail.style.display = 'block';
        msgWa.style.display = 'none';
      } else {
        msgEmail.style.display = 'none';
        msgWa.style.display = 'block';
      }
    }
  }

  if (page === 'boutique') renderAllProducts('tous');
  if (page === 'panier') renderPanier();
  if (page === 'paiement') { renderRecap(); setTimeout(() => window.toggleEmail(), 50); }
}

window.filterAndGo = function(type) {
  window.showPage('boutique');
  setTimeout(() => {
    const btn = [...document.querySelectorAll('.filter-btn')].find(b =>
      b.textContent.toLowerCase().includes(type)
    );
    if (btn) window.filterProducts(type, btn);
  }, 100);
}

window.filterProducts = function(filtre, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAllProducts(filtre);
}

window.ajouterAuPanier = function(id) {
  const produit = PRODUITS.find(p => p.id === id);
  if (!produit) return;
  if (panier.find(p => p.id === id)) {
    showToast('Déjà dans ton panier !', '⚠️');
    return;
  }
  panier.push(produit);
  updateCartCount();
  showToast(`"${produit.titre}" ajouté !`, '✅');
}

window.retirerDuPanier = function(id) {
  panier = panier.filter(p => p.id !== id);
  updateCartCount();
  renderPanier();
}

window.confirmerPaiement = async function() {
  const nom         = document.getElementById('f-nom')?.value.trim();
  const tel         = document.getElementById('f-tel')?.value.trim();
  const moyen       = document.getElementById('f-moyen')?.value;
  const transaction = document.getElementById('f-transaction')?.value.trim();
  const livraison   = document.getElementById('f-livraison')?.value;
  const email       = document.getElementById('f-email')?.value.trim();
  const note        = document.getElementById('f-note')?.value.trim();

  // Validation
  if (!nom || !tel || !moyen || !transaction) {
    showToast('Remplis tous les champs obligatoires !', '❌'); return;
  }
  if (livraison === 'email' && !email) {
    showToast('Entre ton adresse email !', '❌'); return;
  }
  if (livraison === 'email' && !isValidEmail(email)) {
    showToast('Adresse email invalide !', '❌'); return;
  }

  const btn = document.querySelector('#page-paiement .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enregistrement...'; }

  try {
    // ── Enregistrer la commande dans Firestore avec statut "en_attente" ──
    const { getFirestore, collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const db = getFirestore();

    const commande = {
      nom,
      tel,
      moyen,
      transaction,
      livraison,
      email: email || '',
      note:  note  || '',
      documents: panier.map(p => ({
        id:     p.id,
        titre:  p.titre,
        niveau: p.niveau,
        matiere:p.matiere,
        prix:   p.prix,
        lien_pdf: p.lien_pdf,
      })),
      total:   getTotalPanier(),
      statut:  'en_attente',   // ← sera mis à "validee" par toi depuis l'admin
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'commandes'), commande);

    // ── Envoyer WhatsApp pour te prévenir ──
    const whatsappURL = `https://wa.me/${WHATSAPP_NUM}?text=${genererMessageWhatsApp()}`;
    window.open(whatsappURL, '_blank');

    panier = [];
    updateCartCount();
    window.showPage('confirmation');

  } catch (err) {
    console.error('Firestore error:', err);
    showToast('Erreur enregistrement — réessaie !', '❌');
    if (btn) { btn.disabled = false; btn.textContent = '📧 Recevoir mes documents →'; }
  }
}

window.payerOrangeMoney = function() {
  const montant = getTotalPanier();
  if (montant === 0) { showToast('Ton panier est vide !', '❌'); return; }
  // Code USSD Orange Money Burkina : *144*2*1*NuméroMarchand*Montant#
  const code = `*144*2*1*06625715*${montant}%23`;
  window.location.href = `tel:${code}`;
  showToast('Compose le code sur ton téléphone 📞', '🟠');
}

window.payerWave = function() {
  const montant = getTotalPanier();
  if (montant === 0) { showToast('Ton panier est vide !', '❌'); return; }
  // Lien deep-link Wave
  window.location.href = `https://wave.com/send?phone=+22606625715&amount=${montant}`;
  showToast('Ouverture de Wave... 🔵', '✅');
}

window.toggleFaq = function(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const arrow = btn.querySelector('.faq-arrow');
  const isOpen = item.classList.contains('open');
  // Fermer tous les autres
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-answer').style.maxHeight = '0';
    el.querySelector('.faq-arrow').textContent = '▼';
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    arrow.textContent = '▲';
  }
}

window.toggleEmail = function() {
  const livraison = document.getElementById('f-livraison')?.value;
  const emailGroup = document.getElementById('email-group');
  if (emailGroup) emailGroup.style.display = livraison === 'email' ? 'block' : 'none';
  // Mettre à jour le texte du bouton
  const btn = document.querySelector('#page-paiement .btn-primary');
  if (btn) {
    btn.textContent = livraison === 'email'
      ? '📧 Recevoir mes documents par email →'
      : '💬 Confirmer via WhatsApp →';
  }
}

window.toggleDropdown = function() {
  document.getElementById('dropdown-menu')?.classList.toggle('open');
}

// ─── FONCTIONS INTERNES ───

function renderCard(p, delay = 0) {
  const badgeLabel = p.type === 'cours' ? 'Cours' : p.type === 'exercices' ? 'Exercices' : 'Annales';
  const hasApercu = p.apercu && p.apercu.trim() !== '';
  return `
    <div class="product-card" style="animation-delay:${delay}s">
      <div class="product-thumb" style="background:${p.bg}">
        ${p.icon}
        <span class="product-badge badge-${p.type}">${badgeLabel}</span>
      </div>
      <div class="product-body">
        <div class="product-level">${p.niveau}</div>
        <div class="product-title">${p.titre}</div>
        <div class="product-matiere">📌 ${p.matiere}</div>
        <div class="product-desc">${p.description}</div>
      </div>
      <div class="product-apercu-bar">
        ${hasApercu
          ? `<a href="${p.apercu}" target="_blank" class="apercu-btn">👁️ Aperçu gratuit</a>`
          : `<span class="apercu-locked">🔒 Aperçu non disponible</span>`
        }
        <span class="pages-info">PDF complet</span>
      </div>
      <div class="product-footer">
        <span class="product-price">${p.prix} FCFA</span>
        <button class="add-btn" onclick="ajouterAuPanier(${p.id})">+ Panier</button>
      </div>
    </div>
  `;
}

function renderFeatured() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  container.innerHTML = PRODUITS.slice(0, 4).map((p, i) => renderCard(p, i * 0.08)).join('');
}

function renderAllProducts(filtre) {
  const container = document.getElementById('all-products');
  if (!container) return;
  const filtres = filtre === 'tous'
    ? PRODUITS
    : PRODUITS.filter(p => p.type === filtre || p.niveau.toLowerCase() === filtre);
  if (filtres.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-muted);grid-column:1/-1;"><div style="font-size:2.5rem;margin-bottom:12px;">😕</div><p>Aucun produit dans cette catégorie.</p></div>`;
    return;
  }
  container.innerHTML = filtres.map((p, i) => renderCard(p, i * 0.06)).join('');
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = panier.length;
}

function getTotalPanier() {
  return panier.reduce((sum, p) => sum + p.prix, 0);
}

function renderPanier() {
  const container = document.getElementById('panier-items');
  const totalEl = document.getElementById('panier-total');
  const totalPrix = document.getElementById('total-prix');
  if (!container) return;
  if (panier.length === 0) {
    container.innerHTML = `<div class="panier-empty"><div class="empty-icon">🛒</div><p>Ton panier est vide.<br/>Ajoute des documents depuis la boutique !</p><button class="btn-primary" onclick="showPage('boutique')" style="margin-top:20px;">Voir la boutique →</button></div>`;
    if (totalEl) totalEl.style.display = 'none';
    return;
  }
  container.innerHTML = panier.map((p, i) => `
    <div class="panier-item" style="animation-delay:${i * 0.07}s">
      <div class="panier-item-info">
        <div class="panier-item-icon">${p.icon}</div>
        <div>
          <div class="panier-item-title">${p.titre}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">${p.niveau} · ${p.matiere}</div>
        </div>
      </div>
      <span class="panier-item-price">${p.prix} FCFA</span>
      <button class="remove-btn" onclick="retirerDuPanier(${p.id})">🗑️</button>
    </div>
  `).join('');
  if (totalEl) totalEl.style.display = 'block';
  if (totalPrix) totalPrix.textContent = `${getTotalPanier()} FCFA`;
}

function renderRecap() {
  const container = document.getElementById('recap-items');
  const totalEl = document.getElementById('recap-total');
  const omCode = document.getElementById('om-code-display');
  if (!container) return;
  container.innerHTML = panier.map(p => `
    <div class="recap-item">
      <span>${p.icon} ${p.titre} <small style="color:var(--text-muted)">(${p.niveau} · ${p.matiere})</small></span>
      <span style="font-weight:700;color:var(--primary);white-space:nowrap">${p.prix} FCFA</span>
    </div>
  `).join('');
  const total = getTotalPanier();
  if (totalEl) totalEl.textContent = `${total} FCFA`;
  // Mettre à jour le code Orange Money avec le vrai montant
  if (omCode) omCode.textContent = `*144*2*1*06625715*${total}#`;
}

function genererMessageWhatsApp() {
  const nom = document.getElementById('f-nom')?.value.trim() || '';
  const tel = document.getElementById('f-tel')?.value.trim() || '';
  const moyen = document.getElementById('f-moyen')?.value || '';
  const transaction = document.getElementById('f-transaction')?.value.trim() || '';
  const livraison = document.getElementById('f-livraison')?.value || 'whatsapp';
  const email = document.getElementById('f-email')?.value.trim() || '';
  const note = document.getElementById('f-note')?.value.trim() || '';
  const liste = panier.map(p => `  - ${p.icon} ${p.titre} (${p.niveau} · ${p.matiere}) → ${p.prix} FCFA`).join('\n');
  let msg = `🛒 *NOUVELLE COMMANDE - EduPremium*\n\n`;
  msg += `👤 *Nom :* ${nom}\n📞 *Téléphone :* ${tel}\n💳 *Moyen de paiement :* ${moyen}\n🔢 *N° Transaction :* ${transaction}\n`;
  msg += `📦 *Livraison :* ${livraison === 'whatsapp' ? 'WhatsApp' : 'Email (' + email + ')'}\n\n`;
  msg += `📋 *Documents commandés :*\n${liste}\n\n💰 *Total payé :* ${getTotalPanier()} FCFA`;
  if (note) msg += `\n\n📝 *Note :* ${note}`;
  return encodeURIComponent(msg);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.payerOrangeMoney = function() {
  const montant = getTotalPanier();
  if (montant === 0) { showToast('Ton panier est vide !', '❌'); return; }
  const code = `*144*2*1*06625715*${montant}%23`;
  window.location.href = `tel:${code}`;
  showToast('Compose le code sur ton téléphone 📞', '🟠');
}

window.payerWave = function() {
  const montant = getTotalPanier();
  if (montant === 0) { showToast('Ton panier est vide !', '❌'); return; }
  window.location.href = `https://wave.com/send?phone=+22606625715&amount=${montant}`;
  showToast('Ouverture de Wave... 🔵', '✅');
}

window.toggleFaq = function(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer');
  const arrow = btn.querySelector('.faq-arrow');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-answer').style.maxHeight = '0';
    el.querySelector('.faq-arrow').textContent = '▼';
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    arrow.textContent = '▲';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message, icon = '✅') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${icon} ${message}`;
  toast.style.cssText = `position:fixed;bottom:clamp(16px,4vw,32px);left:50%;transform:translateX(-50%) translateY(20px);background:#1e1b4b;color:white;padding:12px 24px;border-radius:50px;font-family:'Nunito',sans-serif;font-weight:700;font-size:clamp(0.82rem,2vw,0.92rem);z-index:9999;white-space:nowrap;opacity:0;transition:all 0.3s ease;box-shadow:0 8px 32px rgba(0,0,0,0.2);max-width:90vw;text-align:center;`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity='1'; toast.style.transform='translateX(-50%) translateY(0)'; });
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(-50%) translateY(20px)'; setTimeout(()=>toast.remove(),300); }, 2800);
}

// ─── DÉMARRAGE ───
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  window.showPage('home');
  // Fermer dropdown si clic ailleurs
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-dropdown')) {
      document.getElementById('dropdown-menu')?.classList.remove('open');
    }
  });
});
