// ════════════════════════════════════════════════════════════
// AUTHENTIFICATION FIREBASE - EduPremium
// ════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4rQ1S1qLiZ0upwkcjVnghucUDKK95pYs",
  authDomain: "exercices-devoirs-annales.firebaseapp.com",
  projectId: "exercices-devoirs-annales",
  storageBucket: "exercices-devoirs-annales.firebasestorage.app",
  messagingSenderId: "19077695329",
  appId: "1:19077695329:web:de8d1db36ed54a6e07e720"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Partager l'instance auth avec app.js
window._firebaseAuth = auth;

// ─── SURVEILLER LA CONNEXION ───
onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp(user);
  } else {
    showAuthPage();
  }
});

function showAuthPage() {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('main-content').style.display = 'none';
}

function showApp(user) {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  const userName = user.displayName || user.email.split('@')[0];
  const userPhoto = user.photoURL || null;
  document.getElementById('user-name').textContent = userName;
  if (userPhoto) {
    document.getElementById('user-avatar').src = userPhoto;
    document.getElementById('user-avatar').style.display = 'block';
    document.getElementById('user-initials').style.display = 'none';
  } else {
    document.getElementById('user-initials').textContent = userName[0].toUpperCase();
    document.getElementById('user-avatar').style.display = 'none';
    document.getElementById('user-initials').style.display = 'flex';
  }
  // Initialiser l'app après connexion
  if (typeof window.showPage === 'function') {
    window.showPage('home');
  }
}

// ─── FONCTIONS EXPOSÉES GLOBALEMENT ───

window.switchAuthMode = function(mode) {
  document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('auth-title').textContent = mode === 'register' ? 'Créer un compte' : 'Bon retour ! 👋';
  document.getElementById('auth-subtitle').textContent = mode === 'register'
    ? 'Inscris-toi pour accéder à tous nos documents'
    : 'Connecte-toi pour accéder à tes documents';
  clearErrors();
}

window.registerWithEmail = async function() {
  const nom = document.getElementById('reg-nom').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (!nom || !email || !password || !confirm) { showError('register', 'Remplis tous les champs !'); return; }
  if (password.length < 6) { showError('register', 'Mot de passe trop court (min. 6 caractères) !'); return; }
  if (password !== confirm) { showError('register', 'Les mots de passe ne correspondent pas !'); return; }

  setLoading('register', true);
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    showSuccess('register', '✅ Compte créé ! Vérifie ton email pour confirmer.');
    setTimeout(() => window.switchAuthMode('login'), 3000);
  } catch (error) {
    showError('register', getErrorMessage(error.code));
  } finally {
    setLoading('register', false);
  }
}

window.loginWithEmail = async function() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showError('login', 'Remplis tous les champs !'); return; }
  setLoading('login', true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showError('login', getErrorMessage(error.code));
  } finally {
    setLoading('login', false);
  }
}

window.loginWithGoogle = async function() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    showError('login', getErrorMessage(error.code));
    showError('register', getErrorMessage(error.code));
  }
}

window.logout = async function() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
}

window.togglePassword = function(id) {
  const input = document.getElementById(id);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

// ─── UTILITAIRES ───
function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé !',
    'auth/invalid-email': 'Email invalide !',
    'auth/weak-password': 'Mot de passe trop faible !',
    'auth/user-not-found': 'Aucun compte avec cet email !',
    'auth/wrong-password': 'Mot de passe incorrect !',
    'auth/invalid-credential': 'Email ou mot de passe incorrect !',
    'auth/too-many-requests': 'Trop de tentatives, réessaie plus tard !',
    'auth/popup-closed-by-user': 'Connexion Google annulée.',
    'auth/network-request-failed': 'Problème de connexion internet !'
  };
  return messages[code] || 'Une erreur est survenue, réessaie !';
}

function showError(form, message) {
  const el = document.getElementById(`${form}-error`);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function showSuccess(form, message) {
  const el = document.getElementById(`${form}-success`);
  if (el) { el.textContent = message; el.style.display = 'block'; }
}

function clearErrors() {
  document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
    el.style.display = 'none'; el.textContent = '';
  });
}

function setLoading(form, loading) {
  const btn = document.getElementById(`${form}-btn`);
  if (btn) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Chargement...' : (form === 'login' ? 'Se connecter' : "S'inscrire");
  }
}
