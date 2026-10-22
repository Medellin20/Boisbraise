const fs = require('fs');
const assert = require('node:assert/strict');
const root = process.cwd();
const ts = require(root + '/node_modules/typescript');
const React = require(root + '/node_modules/react');
const Module = require('module');
const originalLoad = Module._load;
const originalResolve = Module._resolveFilename;
let quoteCalls = [], submitCalls = [], submitResolve, navigation = [];
const receiptText = [];
let receiptFilename;
const defer = () => { let resolve; const promise = new Promise(r => resolve = r); return {promise,resolve}; };
Module._resolveFilename = function(id, ...args) { return originalResolve.call(this, id.startsWith('@/') ? root + '/' + id.slice(2) : id, ...args); };
Module._load = function(id, ...args) {
  if (id === 'jspdf') return {jsPDF: class {
    setFont() {} setFontSize() {} setTextColor() {} addPage() {}
    splitTextToSize(value) { return [value]; }
    text(value) { receiptText.push(value); }
    save(value) { receiptFilename = value; }
  }};
  if (id === 'react') return React;
  if (id === 'next/link') return ({children,...props}) => React.createElement('a',props,children);
  if (id === 'next/navigation') return {useRouter:() => ({replace:p=>navigation.push(p)})};
  if (id === 'sonner') return {toast:{success(){},error(){}}};
  if (id === '@/actions/wood-orders') return {
    getWoodCartQuote(lines) { const d=defer(); quoteCalls.push({lines,...d}); return d.promise; },
    submitWoodOrder(value,total) { submitCalls.push({value,total}); const d=defer(); submitResolve=d.resolve; return d.promise; }
  };
  return originalLoad.call(this,id,...args);
};
for (const ext of ['.ts','.tsx']) require.extensions[ext] = (mod,filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText, filename);
const {act,create} = require('react-test-renderer');
const {ProductPurchase} = require(root+'/components/wood/product-purchase.tsx');
const {CheckoutForm} = require(root+'/components/wood/checkout-form.tsx');
const {CART_STORAGE_KEY, ORDER_CONFIRMATION_STORAGE_KEY, normalizeCartLine, cartLineDetails} = require(root+'/lib/utils/cart.ts');
const storage = () => { const data = new Map(); return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}; };
global.localStorage=storage(); global.sessionStorage=storage(); global.window={dispatchEvent(){}};
global.FormData=class {get(k){return k==='acceptTerms'?'on':'';}};
const text = tree => JSON.stringify(tree.toJSON());
const packages=[{package_code:'12_5_litres',label:'12,5 litres',volume_litres:12.5,price:4.5},{package_code:'40_litres',label:'40 litres',volume_litres:40,price:14}];
const product={slug:'hetre',name:'Hêtre',in_stock:true,stock_m3:100,wood_sales_settings:{packages,allowedLengthsCm:[25,33,100],maxQuantityPerProduct:1000,deliveryPricePerLitre:0.1}};
function quote(call) {
 const lines=call.lines.map(l=>({...l,name:'Hêtre',packageLabel:packages.find(p=>p.package_code===l.packageCode).label,unitPrice:14,total:14*l.quantity}));
 const subtotal=lines.reduce((s,l)=>s+l.total,0); const deliveryLitres=lines.reduce((s,l)=>s+40*l.quantity,0); const deliveryFee=deliveryLitres*0.1;
 return {success:true,lines,subtotal,deliveryFee,deliveryLitres,deliveryPricePerLitre:0.1,total:subtotal+deliveryFee,deposit:(subtotal+deliveryFee)/2};
}
(async()=>{
 let purchase;
 act(()=>{purchase=create(React.createElement(ProductPurchase,{product}));});
 act(()=>purchase.root.findAllByType('button').find(b=>JSON.stringify(b.props.children, (k,v)=>k === '_owner' ? undefined : v).includes('40 litres')).props.onClick());
 act(()=>purchase.root.findAllByType('button').find(b=>b.props.children==='1 m').props.onClick());
 act(()=>purchase.root.findByType('input').props.onChange({target:{value:'3'}}));
 act(()=>purchase.root.findAllByType('button').find(b=>JSON.stringify(b.props.children, (k,v)=>k === '_owner' ? undefined : v).includes('Format in den Warenkorb')).props.onClick());
 let cart=JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
 assert.equal(cart[0].packageCode,'40_litres'); assert.equal(cart[0].lengthCm,100); assert.equal(cart[0].quantity,3);
 assert.equal(cartLineDetails(normalizeCartLine(cart[0])),'3 × 40 litres · 1 m');
 assert.ok(purchase.root.findAllByType('a').some(a=>a.props.href==='/commande'));
 act(()=>purchase.root.findByType('input').props.onChange({target:{value:'4'}}));
 assert.equal(purchase.root.findAllByType('a').length,0,'changed choices must be added before checkout');
 purchase.unmount();
 let checkout;
 await act(async()=>{checkout=create(React.createElement(CheckoutForm));});
 assert.equal(quoteCalls.length,1);
 await act(async()=>quoteCalls[0].resolve(quote(quoteCalls[0])));
 assert.ok(text(checkout).includes('3 × 40 litres · 1 m'));
 const plus=()=>checkout.root.findAllByType('button').find(b=>b.props['aria-label']==='Ajouter Hêtre');
 act(()=>plus().props.onClick()); act(()=>plus().props.onClick());
 assert.equal(quoteCalls.length,3);
 await act(async()=>quoteCalls[2].resolve(quote(quoteCalls[2])));
 await act(async()=>quoteCalls[1].resolve(quote(quoteCalls[1])));
 assert.ok(text(checkout).includes('5 × 40 litres · 1 m'),'late quote must not revert quantity');
 assert.equal(JSON.parse(localStorage.getItem(CART_STORAGE_KEY))[0].quantity,5);
 const form=checkout.root.findByType('form');
 let submitPromise;
 act(()=>{submitPromise=form.props.onSubmit({preventDefault(){},currentTarget:{}});});
 act(()=>{form.props.onSubmit({preventDefault(){},currentTarget:{}});});
 assert.equal(submitCalls.length,1,'no duplicate submissions');
 assert.equal(plus().props.disabled,true);
 assert.deepEqual(submitCalls[0].value.lines,[{slug:'hetre',lengthCm:100,packageCode:'40_litres',quantity:5}]);
 assert.equal(submitCalls[0].total,90);
 const q=quote(quoteCalls[2]); const order={...q,reference:'HN-TEST',remaining:45,customer:{firstName:'Test',lastName:'Client',address:'Teststraße 1',postalCode:'12345',city:'Berlin'},payment:{method:'link',link:{url:'https://example.com/pay'}}}; delete order.success;
 await act(async()=>{submitResolve({success:true,order}); await submitPromise;});
 assert.deepEqual(JSON.parse(sessionStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY)),order);
 assert.equal(localStorage.getItem(CART_STORAGE_KEY),null);
 assert.deepEqual(navigation,['/commande/paiement']);
 assert.ok(text(checkout).includes('5 × 40 litres'));
 assert.ok(text(checkout).includes('1 m'));
 checkout.unmount();
 // Reload the actual payment component from the stored server confirmation.
 const {PaymentInstructions}=require(root+'/components/wood/payment-instructions.tsx');
 let payment; await act(async()=>{payment=create(React.createElement(PaymentInstructions));});
 assert.ok(text(payment).includes('5 × 40 litres'));
 assert.ok(text(payment).includes('HN-TEST')); payment.unmount();
 await act(async()=>{payment=create(React.createElement(PaymentInstructions,{initialOrder:{...order,adminNotified:false}}));});
 assert.ok(text(payment).includes('Bestellung vorbereitet'));
 assert.ok(text(payment).includes('bevor Sie bezahlen'));
 assert.ok(!text(payment).includes('Anfrage gesendet'));
 payment.unmount();
 const {downloadOrderReceipt}=require(root+'/lib/utils/order-receipt.ts');
 await downloadOrderReceipt({...order,lines:[
   {...order.lines[0],packageLabel:'Kiste 40 Liter'},
   {...order.lines[0],slug:'chene',name:'Chêne',lengthCm:33,packageCode:'1_rm',packageLabel:'Palette 1 RM',quantity:2,unitPrice:199,total:398}
 ]});
 assert.ok(receiptText.some(t=>t.includes('5 × Kiste 40 Liter · Buche · 1 m')));
 assert.ok(receiptText.some(t=>t.includes('2 × Palette 1 RM · Eiche · 33 cm')));
 assert.ok(receiptText.some(t=>t.includes('Einzelpreis:')));
 assert.ok(receiptText.some(t=>t.includes('keine Zahlungsquittung')));
 assert.equal(receiptFilename,'HolzNest-Bestellbeleg-HN-TEST.pdf');
 // A storage failure after success must still display the confirmed order, without another submit.
 localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(cart));
 await act(async()=>{checkout=create(React.createElement(CheckoutForm));});
 await act(async()=>quoteCalls.at(-1).resolve(quote(quoteCalls.at(-1))));
 sessionStorage.setItem=()=>{throw Error('Storage blocked');};
 await act(async()=>{const p=checkout.root.findByType('form').props.onSubmit({preventDefault(){},currentTarget:{}}); submitResolve({success:true,order}); await p;});
 assert.ok(text(checkout).includes('HN-TEST'));
 assert.equal(localStorage.getItem(CART_STORAGE_KEY),null);
 assert.equal(navigation.length,1); checkout.unmount();
 console.log('PASS: product options → cart → latest quote → single submission → payment → reload; storage failure fallback. No email sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
