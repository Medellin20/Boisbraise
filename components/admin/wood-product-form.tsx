'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { createWoodProduct, updateWoodProduct, type WoodProductInput } from '@/actions/admin-wood-products';
import { WOOD_LENGTHS } from '@/lib/utils/wood';
import type { WoodProductRecord, WoodProductLengthRecord } from '@/types/database';

type Initial = WoodProductRecord & { wood_product_lengths: WoodProductLengthRecord[] };
function toSlug(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
const inputClass='mt-1 block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900';
export function WoodProductForm({initial}:{initial?:Initial}){
  const router=useRouter();
  const [pending,setPending]=useState(false);
  const [autoSlug,setAutoSlug]=useState(!initial);
  const defaults=useMemo(()=>Object.fromEntries(WOOD_LENGTHS.map(cm=>[cm,initial?.wood_product_lengths.find(item=>item.length_cm===cm)?.price_per_m3?.toString()??''])) as Record<number,string>,[initial]);
  const [lengthPrices,setLengthPrices]=useState<Record<number,string>>(defaults);
  async function submit(formData:FormData){
    setPending(true);
    const nullable=(key:string)=>{const value=String(formData.get(key)??'').trim();return value===''?null:Number(value);};
    const value:WoodProductInput={
      name:String(formData.get('name')??'').trim(),slug:String(formData.get('slug')??'').trim(),shortDescription:String(formData.get('shortDescription')??''),description:String(formData.get('description')??''),
      pricePerM3:Number(formData.get('pricePerM3')),moisturePercent:nullable('moisturePercent'),calorificValueKwh:nullable('calorificValueKwh'),stockM3:nullable('stockM3'),
      deliveryAvailable:formData.get('deliveryAvailable')==='on',inStock:formData.get('inStock')==='on',isPublished:formData.get('isPublished')==='on',sortOrder:Number(formData.get('sortOrder')||0),
      lengths:WOOD_LENGTHS.map((lengthCm)=>({lengthCm,price:lengthPrices[lengthCm]?.trim()===''?null:Number(lengthPrices[lengthCm])}))
    };
    try{
      const result=initial?await updateWoodProduct(initial.id,value):await createWoodProduct(value);
      if(result.success){toast.success(result.message);if(!initial&&'id'in result)router.push(`/admin/bois/${result.id}`);router.refresh();}
      else toast.error(result.message);
    }catch{toast.error('Enregistrement impossible. Vérifiez la connexion à Supabase.');}
    finally{setPending(false);}
  }
  return <form onSubmit={(event)=>{event.preventDefault(); void submit(new FormData(event.currentTarget));}} className="space-y-6">
    <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6"><h2 className="font-bold text-ink-900">Informations produit</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-ink-700">Nom de l’essence<input name="name" required minLength={2} defaultValue={initial?.name??''} onChange={(e)=>{if(autoSlug){const el=e.currentTarget.form?.elements.namedItem('slug') as HTMLInputElement|null;if(el)el.value=toSlug(e.currentTarget.value);}}} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700">Slug URL<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={initial?.slug??''} onInput={()=>setAutoSlug(false)} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700 sm:col-span-2">Description courte<textarea name="shortDescription" maxLength={240} rows={2} defaultValue={initial?.short_description??''} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700 sm:col-span-2">Description détaillée<textarea name="description" maxLength={5000} rows={4} defaultValue={initial?.description??''} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700">Prix de base (€ / m³)<input name="pricePerM3" type="number" min="0" step="0.01" required defaultValue={initial?.price_per_m3??''} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700">Humidité maximale (%)<input name="moisturePercent" type="number" min="0" max="100" step="0.1" defaultValue={initial?.moisture_percent??''} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700">Pouvoir calorifique (kWh / m³)<input name="calorificValueKwh" type="number" min="0" step="0.01" defaultValue={initial?.calorific_value_kwh??''} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700">Stock disponible (m³)<input name="stockM3" type="number" min="0" step="0.01" defaultValue={initial?.stock_m3??''} className={inputClass}/></label>
      <label className="text-sm font-medium text-ink-700">Ordre d’affichage<input name="sortOrder" type="number" min="0" defaultValue={initial?.sort_order??0} className={inputClass}/></label>
    </div></section>
    <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6"><h2 className="font-bold text-ink-900">Prix par longueur de bûche</h2><p className="mt-1 text-xs text-ink-500">Laissez vide si le tarif doit être confirmé par devis.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{WOOD_LENGTHS.map((cm)=><label key={cm} className="text-sm font-medium text-ink-700">{cm===100?'1 m':`${cm} cm`} · €/m³<input type="number" min="0" step="0.01" placeholder="Sur devis" value={lengthPrices[cm]??''} onChange={(e)=>setLengthPrices(prev=>({...prev,[cm]:e.target.value}))} className={inputClass}/></label>)}</div></section>
    <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6"><h2 className="font-bold text-ink-900">Disponibilité et publication</h2><div className="mt-4 flex flex-wrap gap-5">{[['deliveryAvailable','Livraison disponible',initial?.delivery_available??true],['inStock','En stock',initial?.in_stock??true],['isPublished','Publié sur le site',initial?.is_published??false]].map(([name,label,checked])=><label key={String(name)} className="inline-flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="h-4 w-4 accent-[#31563b]"/>{String(label)}</label>)}</div></section>
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16}/>{pending?'Enregistrement…':'Enregistrer le produit'}</button>
  </form>;
}
