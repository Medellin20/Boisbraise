const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const root = process.cwd();
const load = Module._load;
const resolve = Module._resolveFilename;
const packages = ['12_5_litres', '20_litres', '40_litres', '1_rm'].map((package_code, sort_order) => ({package_code, sort_order, label: package_code, volume_litres: 40, price: 14}));
const rows = {
  wood_products: [{id:'wood-1', slug:'hetre', name:'Hêtre', in_stock:true, stock_m3:10}],
  wood_sales_settings: {allowed_lengths_cm:[33], max_quantity_per_product:100, delivery_price_per_litre:0.1},
  wood_sales_packages: packages,
  wood_store_settings: {payment_method:'link',payment_url:'https://example.com/pay',bank_name:'',bank_account_holder:'',bank_iban:'',bank_bic:''},
};
const client = {from(table) {
  const query = {then(done) { return Promise.resolve({data:rows[table],error:null}).then(done); }};
  for (const method of ['select','in','eq','order','maybeSingle']) query[method] = () => query;
  return query;
}};
let notified = false;
Module._resolveFilename = function(id,...args) { return resolve.call(this,id.startsWith('@/') ? root+'/'+id.slice(2) : id,...args); };
Module._load = function(id,...args) {
  if (id === 'server-only') return {};
  if (id === '@/lib/supabase/server') return {createClient:()=>client};
  if (id === '@/lib/supabase/admin') return {createAdminClient:()=>client};
  if (id === '@/lib/notifications/email') return {sendAdminAlert:async()=>notified};
  return load.call(this,id,...args);
};
require.extensions['.ts'] = (mod,file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const {submitWoodOrder} = require(root+'/actions/wood-orders.ts');
const input = {customer:{firstName:'Test',lastName:'Client',address:'Teststrasse 1',postalCode:'12345',city:'Berlin',phone:'123456789',email:'test@example.com'},lines:[{slug:'hetre',packageCode:'40_litres',lengthCm:33,quantity:2}],website:'',acceptTerms:true};
(async()=>{
  // Missing Gmail must still allow a truthful payment summary.
  delete process.env.GMAIL_USER; delete process.env.GMAIL_APP_PASSWORD;
  const result = await submitWoodOrder(input,36);
  assert.equal(result.success,true);
  assert.equal(result.order.adminNotified,false);
  assert.equal(result.order.lines[0].quantity,2);
  assert.equal(result.order.lines[0].lengthCm,33);
  assert.equal(result.order.total,36);
  notified = true;
  assert.equal((await submitWoodOrder(input,36)).order.adminNotified,true);
  assert.equal((await submitWoodOrder(input,35)).success,false);
  rows.wood_store_settings.payment_url = '';
  assert.equal((await submitWoodOrder(input,36)).success,false);
  console.log('PASS: payment summary without Gmail, notification status, chosen items, price and payment configuration validation. No email sent.');
})().catch(error=>{console.error(error);process.exitCode=1;});
