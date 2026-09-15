// Petit bus d'événements pour piloter le widget Léa depuis n'importe quelle page.
//   openLea()                → ouvre le chat
//   openLea('Je voudrais…')  → ouvre le chat et envoie ce message
//   teaseLea('Texte')        → affiche une bulle d'invitation près du bouton (sans ouvrir)

export const LEA_EVENT = 'lea:command';

export function openLea(message) {
  window.dispatchEvent(new CustomEvent(LEA_EVENT, { detail: { type: 'open', message } }));
}

export function teaseLea(text) {
  window.dispatchEvent(new CustomEvent(LEA_EVENT, { detail: { type: 'tease', text } }));
}
