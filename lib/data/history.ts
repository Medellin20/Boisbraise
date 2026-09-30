import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
export async function logAdminAction(params:{action:string;entityType?:string;entityId?:string;details?:Record<string,unknown>;actor?:string}){
  const supabase=createAdminClient();
  await supabase.from('admin_logs').insert({action:params.action,entity_type:params.entityType,entity_id:params.entityId,details:params.details??{},actor:params.actor??'admin'});
}
