'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidAdminSessionToken } from '@/lib/auth/admin-session';
import { ADMIN_SESSION_COOKIE } from '@/lib/utils/constants';
import { logAdminAction } from '@/lib/data/history';

const lengths = z.array(z.object({ lengthCm: z.union([z.literal(25),z.literal(33),z.literal(40),z.literal(50),z.literal(100)]), price: z.number().finite().nonnegative().nullable() })).min(1).max(5);
const schema = z.object({ slug: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().trim().min(2).max(100), shortDescription: z.string().max(240), description: z.string().max(5000), pricePerM3: z.number().finite().nonnegative(), moisturePercent: z.number().finite().min(0).max(100).nullable(), calorificValueKwh: z.number().finite().nonnegative().nullable(), deliveryAvailable: z.boolean(), inStock: z.boolean(), stockM3: z.number().finite().nonnegative().nullable(), isPublished: z.boolean(), sortOrder: z.number().int().min(0).max(9999), lengths });
export type WoodProductInput = z.infer<typeof schema>;
const fail = (message: string) => ({ success: false as const, message });
async function authorized() { return isValidAdminSessionToken(cookies().get(ADMIN_SESSION_COOKIE)?.value); }
function publicRefresh(slug?: string) { revalidatePath('/'); revalidatePath('/catalogue'); revalidatePath('/admin/bois'); if (slug) revalidatePath(`/catalogue/${slug}`); }
function dbPayload(input: WoodProductInput) { return { slug: input.slug, name: input.name, short_description: input.shortDescription, description: input.description, price_per_m3: input.pricePerM3, moisture_percent: input.moisturePercent, calorific_value_kwh: input.calorificValueKwh, delivery_available: input.deliveryAvailable, in_stock: input.inStock, stock_m3: input.stockM3, is_published: input.isPublished, sort_order: input.sortOrder }; }
async function saveLengths(productId: string, input: WoodProductInput) {
  const supabase = createAdminClient();
  const { error: upsertError } = await supabase.from('wood_product_lengths').upsert(input.lengths.map((l, sort_order) => ({ product_id: productId, length_cm: l.lengthCm, price_per_m3: l.price, sort_order })), { onConflict: 'product_id,length_cm' });
  if (upsertError) return false;
  const selected = input.lengths.map((item) => String(item.lengthCm));
  const { error } = await supabase.from('wood_product_lengths').delete().eq('product_id', productId).not('length_cm','in',`(${selected.join(',')})`);
  return !error;
}
export async function createWoodProduct(value: unknown) {
  if (!await authorized()) return fail('Session administrateur expirée. Reconnectez-vous.');
  const parsed = schema.safeParse(value); if (!parsed.success) return fail('Vérifiez les champs du produit et les tarifs de longueur.');
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('wood_products').insert(dbPayload(parsed.data)).select('id').single();
  if (error || !data) return fail(error?.code === '23505' ? 'Ce slug est déjà utilisé.' : 'Le produit n’a pas pu être enregistré. Appliquez d’abord la migration du catalogue bois dans Supabase.');
  const lengthsSaved = await saveLengths(data.id, parsed.data);
  await logAdminAction({ action: 'wood_product.create', entityType: 'wood_product', entityId: data.id });
  publicRefresh(parsed.data.slug);
  return { success: true as const, message: lengthsSaved ? 'Produit ajouté.' : 'Produit créé. Vérifiez les tarifs par longueur dans sa fiche.', id: data.id };
}
export async function updateWoodProduct(id: string, value: unknown) {
  if (!await authorized()) return fail('Session administrateur expirée. Reconnectez-vous.');
  const parsed = schema.safeParse(value); if (!parsed.success) return fail('Vérifiez les champs du produit et les tarifs de longueur.');
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('wood_products').update({ ...dbPayload(parsed.data), updated_at: new Date().toISOString() }).eq('id',id).select('id').maybeSingle();
  if (error || !data) return fail(error?.code === '23505' ? 'Ce slug est déjà utilisé.' : 'Le produit n’a pas pu être modifié.');
  const lengthsSaved = await saveLengths(id, parsed.data);
  await logAdminAction({ action: 'wood_product.update', entityType: 'wood_product', entityId: id });
  publicRefresh(parsed.data.slug);
  return { success: true as const, message: lengthsSaved ? 'Modifications enregistrées.' : 'Produit modifié. Vérifiez les tarifs par longueur.' };
}
export async function deleteWoodProduct(id: string) {
  if (!await authorized()) return fail('Session administrateur expirée. Reconnectez-vous.');
  const supabase = createAdminClient();
  const { data: images, error: readError } = await supabase.from('wood_product_images').select('storage_path').eq('product_id',id);
  if (readError) return fail('Impossible de charger les photos. Produit conservé.');
  const { data, error } = await supabase.from('wood_products').delete().eq('id',id).select('slug').maybeSingle();
  if (error || !data) return fail('Impossible de supprimer le produit.');
  const paths = (images ?? []).map((img) => img.storage_path).filter(Boolean);
  const { error: storageError } = paths.length ? await supabase.storage.from('wood-product-images').remove(paths) : { error: null };
  await logAdminAction({ action: 'wood_product.delete', entityType: 'wood_product', entityId: id });
  publicRefresh(data.slug);
  return { success: true as const, message: storageError ? 'Produit supprimé. Les photos résiduelles restent à nettoyer dans Supabase Storage.' : 'Produit supprimé.' };
}
export async function uploadWoodProductImage(productId: string, formData: FormData) {
  if (!await authorized()) return fail('Session administrateur expirée. Reconnectez-vous.');
  const files = formData.getAll('images');
  if (files.length !== 1 || !(files[0] instanceof File)) return fail('Sélectionnez une seule image à la fois.');

  const file = files[0];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxFileSize = 10 * 1024 * 1024;
  if (!allowedTypes.includes(file.type) || file.size < 1 || file.size > maxFileSize) {
    return fail('Format invalide : JPG, PNG, WebP ou AVIF, 10 Mo maximum.');
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Configuration Supabase admin invalide.');
  }
  const { data: product, error: productError } = await supabase
    .from('wood_products')
    .select('slug')
    .eq('id', productId)
    .maybeSingle();
  if (productError) return fail(`Impossible de vérifier le produit : ${productError.message}`);
  if (!product) return fail('Produit introuvable.');

  const bucketName = 'wood-product-images';
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
  if (bucketError) {
    const status = 'status' in bucketError ? bucketError.status : undefined;
    const bucketMissing = status === 404 || /bucket not found/i.test(bucketError.message);
    if (!bucketMissing) return fail(`Configuration Supabase Storage : ${bucketError.message}`);

    const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: maxFileSize,
      allowedMimeTypes: allowedTypes,
    });
    if (createBucketError && !/already exists/i.test(createBucketError.message)) {
      return fail(`Le bucket de photos ne peut pas être créé : ${createBucketError.message}`);
    }
  } else {
    const bucketSettingsMatch = bucket.public
      && bucket.file_size_limit === maxFileSize
      && allowedTypes.every((type) => bucket.allowed_mime_types?.includes(type));
    if (!bucketSettingsMatch) {
      const { error: updateBucketError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: maxFileSize,
        allowedMimeTypes: allowedTypes,
      });
      if (updateBucketError) return fail(`Les réglages du bucket de photos sont incorrects : ${updateBucketError.message}`);
    }
  }

  const { count, error: countError } = await supabase
    .from('wood_product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);
  if (countError) return fail(`Impossible de préparer la fiche photo : ${countError.message}`);

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = `${productId}/${crypto.randomUUID()}.${extension}`;
  const fileBytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, fileBytes, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (uploadError) {
    const status = 'status' in uploadError ? ` (${uploadError.status})` : '';
    return fail(`Supabase Storage a refusé la photo${status} : ${uploadError.message}`);
  }

  const { data: url } = supabase.storage.from(bucketName).getPublicUrl(path);
  const { data, error } = await supabase.from('wood_product_images').insert({
    product_id: productId,
    storage_path: path,
    url: url.publicUrl,
    alt_text: `Bois ${product.slug}`,
    is_primary: (count ?? 0) === 0,
    sort_order: count ?? 0,
  }).select('*').single();

  if (error || !data) {
    await supabase.storage.from(bucketName).remove([path]);
    return fail(error
      ? `Photo envoyée, mais sa fiche n’a pas été enregistrée : ${error.message}`
      : 'Photo envoyée, mais sa fiche n’a pas été enregistrée.');
  }

  await logAdminAction({ action: 'wood_product.image_upload', entityType: 'wood_product', entityId: productId });
  publicRefresh(product.slug);
  revalidatePath(`/admin/bois/${productId}`);
  return { success: true as const, message: 'Photo ajoutée.', image: data };
}
export async function deleteWoodProductImage(productId: string, imageId: string) {
  if (!await authorized()) return fail('Session administrateur expirée. Reconnectez-vous.');
  const supabase=createAdminClient();
  const {data:image,error:readError}=await supabase.from('wood_product_images').select('*').eq('id',imageId).eq('product_id',productId).maybeSingle();
  if(readError||!image) return fail('Photo introuvable.');
  const {error}=await supabase.from('wood_product_images').delete().eq('id',imageId);
  if(error) return fail('La photo n’a pas pu être supprimée.');
  const {error:storageError}=await supabase.storage.from('wood-product-images').remove([image.storage_path]);
  if(image.is_primary){const {data:next}=await supabase.from('wood_product_images').select('id').eq('product_id',productId).order('sort_order').limit(1).maybeSingle(); if(next) await supabase.from('wood_product_images').update({is_primary:true}).eq('id',next.id);}
  await logAdminAction({action:'wood_product.image_delete',entityType:'wood_product',entityId:productId});
  publicRefresh(); revalidatePath(`/admin/bois/${productId}`);
  return {success:true as const,message:storageError?'Photo retirée du produit ; le fichier Storage reste à nettoyer.':'Photo supprimée.'};
}
export async function setPrimaryWoodProductImage(productId:string,imageId:string) {
  if(!await authorized()) return fail('Session administrateur expirée. Reconnectez-vous.');
  const supabase=createAdminClient();
  const {data,error}=await supabase.from('wood_product_images').update({is_primary:true}).eq('id',imageId).eq('product_id',productId).select('id').maybeSingle();
  if(error||!data) return fail('Impossible de définir cette photo comme principale.');
  await logAdminAction({action:'wood_product.image_primary',entityType:'wood_product',entityId:productId});
  publicRefresh(); revalidatePath(`/admin/bois/${productId}`);
  return {success:true as const,message:'Photo principale mise à jour.'};
}
