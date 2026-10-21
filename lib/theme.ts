export const THEME_KEY = "benely-theme";

/**
 * Script exécuté avant l'affichage: applique le thème mémorisé pour éviter un flash de couleurs.
 * Sans choix mémorisé, c'est la préférence du système qui s'applique (CSS).
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
