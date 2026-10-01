import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getWoodProductByIdAdmin } from '@/lib/data/admin-wood-products';
import { WoodProductForm } from '@/components/admin/wood-product-form';
import { WoodImageManager } from '@/components/admin/wood-image-manager';
import { DeleteWoodProductButton } from '@/components/admin/delete-wood-product-button';
export const metadata:Metadata={title:'Holzprodukt bearbeiten'};
export const dynamic='force-dynamic';
export default async function EditWoodProductPage({params}:{params:{id:string}}){const product=await getWoodProductByIdAdmin(params.id);if(!product)notFound();return <div><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/admin/bois" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft size={16}/>Zurück zum Katalog</Link><div className="flex items-center gap-3">{product.is_published&&<Link href={`/catalogue/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#31563b] hover:underline">Öffentliche Seite ansehen <ExternalLink size={14}/></Link>}<DeleteWoodProductButton id={product.id}/></div></header><h1 className="mb-6 text-2xl font-extrabold text-ink-900">{product.name} bearbeiten</h1><div className="max-w-4xl space-y-6"><WoodImageManager productId={product.id} initialImages={product.wood_product_images}/><WoodProductForm initial={product}/></div></div>;}
