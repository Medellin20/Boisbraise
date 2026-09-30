import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WoodProductForm } from '@/components/admin/wood-product-form';
export const metadata:Metadata={title:'Ajouter un produit bois'};
export default function NewWoodProductPage(){return <div><Link href="/admin/bois" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft size={16}/>Retour au catalogue</Link><h1 className="mb-2 text-2xl font-extrabold text-ink-900">Ajouter un produit</h1><p className="mb-6 max-w-2xl text-sm text-ink-500">Créez une essence, saisissez les tarifs pour chaque longueur et choisissez si elle doit apparaître sur le site.</p><div className="max-w-4xl"><WoodProductForm/></div></div>;}
