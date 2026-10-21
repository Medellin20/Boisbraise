-- Essences initiales ; les lignes sont insérées par la migration du catalogue.
insert into public.wood_products(slug,name,short_description,description,price_per_m3,moisture_percent,calorific_value_kwh,delivery_available,in_stock,stock_m3,is_published,sort_order)
values
 ('chene','Chêne','Bois dense à combustion longue, idéal pour les longues soirées.','Le chêne est apprécié pour sa combustion lente et sa chaleur durable.',87.40,20,null,true,true,null,true,1),
 ('hetre','Hêtre','Belle flamme claire et chaleur vive, le préféré des cheminées ouvertes.','Le hêtre offre une flamme lumineuse et une bonne restitution de chaleur.',82.80,20,2050,true,true,40,true,2),
 ('frene','Frêne','Allumage facile, combustion propre et peu de cendres.','Le frêne s’allume facilement et produit une chaleur régulière.',80.96,20,null,true,true,null,true,3),
 ('bouleau','Bouleau','Bois clair, apprécié pour son allumage facile et sa flamme vive.','Le bouleau est un bois facile à allumer, adapté aux feux vifs.',199,20,null,true,true,null,true,4),
 ('charme','Charme','Bois dense qui offre une combustion soutenue.','Le charme est un bois dense, recherché pour sa combustion soutenue.',199,20,null,true,true,null,true,5),
 ('epicea','Épicéa','Bois résineux, souvent choisi pour démarrer un feu.','L’épicéa est un bois résineux qui s’allume rapidement et convient notamment à l’allumage.',199,20,null,true,true,null,true,6)
on conflict(slug) do nothing;
insert into public.wood_product_lengths(product_id,length_cm,price_per_m3,sort_order)
select p.id,l.length_cm,l.price_per_m3,l.sort_order from public.wood_products p join (values
 ('hetre',25,103.50,1),('hetre',33,97.20,2),('hetre',40,93.60,3),('hetre',50,90.00,4),('hetre',100,82.80,5),
 ('chene',25,null::numeric,1),('chene',33,null::numeric,2),('chene',40,null::numeric,3),('chene',50,null::numeric,4),('chene',100,87.40,5),
 ('frene',25,null::numeric,1),('frene',33,null::numeric,2),('frene',40,null::numeric,3),('frene',50,null::numeric,4),('frene',100,80.96,5)
) as l(slug,length_cm,price_per_m3,sort_order) on p.slug=l.slug
on conflict(product_id,length_cm) do nothing;
insert into public.wood_product_lengths(product_id,length_cm,price_per_m3,sort_order)
select p.id,l.length_cm,null,l.sort_order from public.wood_products p
cross join (values (25,1),(33,2),(50,3)) as l(length_cm,sort_order)
where p.slug in ('bouleau','charme','epicea')
on conflict(product_id,length_cm) do nothing;
insert into public.wood_product_packages(product_id,package_code,price,sort_order)
select p.id,l.package_code,l.price,l.sort_order from public.wood_products p
cross join (values
 ('12_5_litres',4.50::numeric,1),('20_litres',7.00::numeric,2),
 ('40_litres',14.00::numeric,3),('1_rm',199.00::numeric,4)
) as l(package_code,price,sort_order)
on conflict(product_id,package_code) do nothing;
