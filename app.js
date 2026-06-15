// ╔══════════════════════════════════════════════════════════╗
// ║         ZONE DE CONFIGURATION - À MODIFIER              ║
// ╚══════════════════════════════════════════════════════════╝

// ─── IMPORT FIREBASE ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── CONFIG FIREBASE ───
const firebaseConfig = {
  apiKey: "AIzaSyD4rQ1S1qLiZ0upwkcjVnghucUDKK95pYs",
  authDomain: "exercices-devoirs-annales.firebaseapp.com",
  projectId: "exercices-devoirs-annales",
  storageBucket: "exercices-devoirs-annales.firebasestorage.app",
  messagingSenderId: "19077695329",
  appId: "1:19077695329:web:de8d1db36ed54a6e07e720"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    description: "Ce pdf contient 34 exercices corrigés.",
    apercu: "apercu_exercice_maths_derivabilite_1_premiere.pdf",
    prix: 200,
    icon: "📘",
    bg: "#eef2ff",
    lien_pdf: "https://drive.google.com/file/d/1EvATt2Gk0qTjisDWwpbRRAF8D8g9nG-8/view?usp=drivesdk"
  }
];

const WHATSAPP_NUM = "22606625715";

let panier = [];

// ─────────────────────────────────────────────
// CONFIRMATION PAIEMENT
// ─────────────────────────────────────────────

window.confirmerPaiement = async function() {

  const nom         = document.getElementById('f-nom')?.value.trim();
  const tel         = document.getElementById('f-tel')?.value.trim();
  const moyen       = document.getElementById('f-moyen')?.value;
  const transaction = document.getElementById('f-transaction')?.value.trim();
  const livraison   = document.getElementById('f-livraison')?.value;
  const email       = document.getElementById('f-email')?.value.trim();
  const note        = document.getElementById('f-note')?.value.trim();

  if (!nom || !tel || !moyen || !transaction) {
    showToast('Remplis tous les champs obligatoires !', '❌');
    return;
  }

  const btn = document.querySelector('#page-paiement .btn-primary');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Enregistrement...';
  }

  try {

    // ─── ENREGISTREMENT FIRESTORE ───
    await addDoc(collection(db, "commandes"), {
      nom,
      tel,
      moyen,
      transaction,
      livraison,
      email: email || "",
      note: note || "",
      total: getTotalPanier(),
      statut: "en_attente",

      documents: panier.map(p => ({
        id: p.id,
        titre: p.titre,
        niveau: p.niveau,
        matiere: p.matiere,
        prix: p.prix,
        lien_pdf: p.lien_pdf || ""
      })),

      createdAt: serverTimestamp()
    });

    // ─── WHATSAPP ───
    const whatsappURL =
      `https://wa.me/${WHATSAPP_NUM}?text=${genererMessageWhatsApp()}`;

    window.open(whatsappURL, '_blank');

    panier = [];

    updateCartCount();

    window.showPage('confirmation');

  } catch (err) {

    console.error(err);

    showToast('Erreur enregistrement !', '❌');

    if (btn) {
      btn.disabled = false;
      btn.textContent = '📧 Recevoir mes documents →';
    }
  }
};

// ─────────────────────────────────────────────
// OUTILS
// ─────────────────────────────────────────────

function getTotalPanier() {
  return panier.reduce((sum, p) => sum + p.prix, 0);
}

function genererMessageWhatsApp() {

  const nom = document.getElementById('f-nom')?.value.trim() || '';

  return encodeURIComponent(
    `Nouvelle commande de ${nom}`
  );
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = panier.length;
}

function showToast(message, icon = '✅') {

  const toast = document.createElement('div');

  toast.innerHTML = `${icon} ${message}`;

  toast.style.cssText = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:#111827;
    color:white;
    padding:12px 20px;
    border-radius:12px;
    z-index:9999;
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}