// Darstellungsübersetzungen für bereits gespeicherte französische Demodaten.
// Diese Hilfen ändern weder Supabase-Daten noch Warenkorb- oder Bestellfelder.
const names: Record<string, string> = { 'Chêne': 'Eiche', 'Hêtre': 'Buche', 'Frêne': 'Esche', 'Bouleau': 'Birke', 'Charme': 'Hainbuche', 'Épicéa': 'Fichte' };
const descriptions: Record<string, string> = {
  'Bois dense à combustion longue, idéal pour les longues soirées.': 'Dichtes Holz mit langer Brenndauer, ideal für lange Abende.',
  'Belle flamme claire et chaleur vive, le préféré des cheminées ouvertes.': 'Helle Flamme und angenehme Wärme – beliebt für offene Kamine.',
  'Allumage facile, combustion propre et peu de cendres.': 'Leicht anzuzünden, sauberer Abbrand und wenig Asche.',
  'Le chêne est apprécié pour sa combustion lente et sa chaleur durable.': 'Eichenholz ist für seinen langsamen Abbrand und seine lang anhaltende Wärme bekannt.',
  'Le hêtre offre une flamme lumineuse et une bonne restitution de chaleur.': 'Buchenholz bietet eine helle Flamme und gibt Wärme sehr gut ab.',
  'Le frêne s’allume facilement et produit une chaleur régulière.': 'Eschenholz lässt sich leicht anzünden und erzeugt gleichmäßige Wärme.',
  'Bois clair, apprécié pour son allumage facile et sa flamme vive.': 'Helles Holz, bekannt für einfaches Anzünden und eine lebhafte Flamme.',
  'Bois dense qui offre une combustion soutenue.': 'Dichtes Holz mit gleichmäßigem Abbrand.',
  'Bois résineux, souvent choisi pour démarrer un feu.': 'Harzreiches Holz, das häufig zum Anzünden verwendet wird.',
  'Le bouleau est un bois facile à allumer, adapté aux feux vifs.': 'Birkenholz lässt sich leicht anzünden und eignet sich für lebhafte Feuer.',
  'Le charme est un bois dense, recherché pour sa combustion soutenue.': 'Hainbuchenholz ist dicht und für seinen gleichmäßigen Abbrand bekannt.',
  'L’épicéa est un bois résineux qui s’allume rapidement et convient notamment à l’allumage.': 'Fichtenholz ist harzreich, entzündet sich schnell und eignet sich besonders zum Anzünden.',
};
export const woodDisplayName = (value: string) => names[value] ?? value;
export const woodDisplayText = (value: string) => descriptions[value] ?? value;
