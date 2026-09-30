'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { deleteWoodProduct } from '@/actions/admin-wood-products';
export function DeleteWoodProductButton({id}:{id:string}){const [pending,setPending]=useState(false);const router=useRouter();async function remove(){if(pending||!window.confirm('Supprimer ce produit et ses photos ? Cette action est définitive.'))return;setPending(true);try{const result=await deleteWoodProduct(id);if(result.success){toast.success(result.message);router.push('/admin/bois');router.refresh();}else toast.error(result.message);}catch{toast.error('Suppression impossible.');}finally{setPending(false);}}return <button type="button" onClick={()=>void remove()} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 disabled:opacity-50"><Trash2 size={15}/>{pending?'Suppression…':'Supprimer'}</button>;}
