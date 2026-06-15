// ════════════════════════════════════════════
// AUTH FIREBASE
// ════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ─── CONFIG FIREBASE ───
const firebaseConfig = {
  apiKey: "AIzaSyD4rQ1S1qLiZ0upwkcjVnghucUDKK95pYs",
  authDomain: "exercices-devoirs-annales.firebaseapp.com",
  projectId: "exercices-devoirs-annales",
  storageBucket: "exercices-devoirs-annales.firebasestorage.app",
  messagingSenderId: "19077695329",
  appId: "1:19077695329:web:de8d1db36ed54a6e07e720"
};

// ─── INITIALISATION ───
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// ─────────────────────────────────────────────
// ÉTAT CONNEXION
// ─────────────────────────────────────────────

onAuthStateChanged(auth, (user) => {

  if (user) {

    document.getElementById('auth-overlay').style.display = 'none';

    document.getElementById('main-content').style.display = 'block';

  } else {

    document.getElementById('auth-overlay').style.display = 'flex';

    document.getElementById('main-content').style.display = 'none';
  }
});

// ─────────────────────────────────────────────
// INSCRIPTION
// ─────────────────────────────────────────────

window.registerWithEmail = async function() {

  const email =
    document.getElementById('reg-email').value.trim();

  const password =
    document.getElementById('reg-password').value;

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Compte créé !");

  } catch (error) {

    alert(error.message);
  }
};

// ─────────────────────────────────────────────
// CONNEXION
// ─────────────────────────────────────────────

window.loginWithEmail = async function() {

  const email =
    document.getElementById('login-email').value.trim();

  const password =
    document.getElementById('login-password').value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    alert(error.message);
  }
};

// ─────────────────────────────────────────────
// DÉCONNEXION
// ─────────────────────────────────────────────

window.logout = async function() {

  await signOut(auth);
};