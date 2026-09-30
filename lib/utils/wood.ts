export const WOOD_LENGTHS = [25, 33, 40, 50, 100] as const;
export function lengthLabel(cm:number){return cm===100?'1 m':`${cm} cm`;}
export function formatWoodPrice(value:number){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(value);}
