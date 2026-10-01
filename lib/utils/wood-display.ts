// Darstellungsübersetzungen für bereits gespeicherte französische Demodaten.
// Diese Hilfen ändern weder Supabase-Daten noch Warenkorb- oder Bestellfelder.
const names: Record<string, string> = { 'Chêne': 'Eiche', 'Hêtre': 'Buche', 'Frêne': 'Esche' };
const descriptions: Record<string, string> = {
  'Bois dense à combustion longue, idéal pour les longues soirées.': 'Dichtes Holz mit langer Brenndauer, ideal für lange Abende.',
  'Belle flamme claire et chaleur vive, le préféré des cheminées ouvertes.': 'Helle Flamme und angenehme Wärme – beliebt für offene Kamine.',
  'Allumage facile, combustion propre et peu de cendres.': 'Leicht anzuzünden, sauberer Abbrand und wenig Asche.',
  'Le chêne est apprécié pour sa combustion lente et sa chaleur durable.': 'Eichenholz ist für seinen langsamen Abbrand und seine lang anhaltende Wärme bekannt.',
  'Le hêtre offre une flamme lumineuse et une bonne restitution de chaleur.': 'Buchenholz bietet eine helle Flamme und gibt Wärme sehr gut ab.',
  'Le frêne s’allume facilement et produit une chaleur régulière.': 'Eschenholz lässt sich leicht anzünden und erzeugt gleichmäßige Wärme.',
};
export const woodDisplayName = (value: string) => names[value] ?? value;
export const woodDisplayText = (value: string) => descriptions[value] ?? value;
