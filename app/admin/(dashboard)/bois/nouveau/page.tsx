import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WoodProductForm } from '@/components/admin/wood-product-form';
export const metadata:Metadata={title:'Holzprodukt hinzufügen'};
export default function NewWoodProductPage(){return <div><Link href="/admin/bois" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft size={16}/>Zurück zum Katalog</Link><h1 className="mb-2 text-2xl font-extrabold text-ink-900">Ajouter une essence</h1><p className="mb-6 max-w-2xl text-sm text-ink-500">Créez la fiche de l’essence. Les prix, formats, longueurs et quantités communs se règlent dans « Vente de bois ».</p><div className="max-w-4xl"><WoodProductForm/></div></div>;}
