# Supabase database setup

1. In the Supabase dashboard, open **SQL Editor** and run the complete
   [`schema.sql`](./schema.sql) file. It creates and seeds the catalog tables,
   stores orders, enables row-level security, and installs the atomic database
   functions used by the server.
2. In **Storage**, create a public bucket named `product-images` (or set
   `SUPABASE_STORAGE_BUCKET` to the bucket name you choose).
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the server environment
   (local `.env` and the Netlify site environment variables). Keep the service
   role key server-only; never use a `NEXT_PUBLIC_` prefix.
4. Deploy/restart the application. The first five catalog products and their
   default prices/photos are inserted by the SQL file. Their default photos
   are served from the app's existing `public/images/catalog` directory.

The application no longer uses SQLite for the catalog, prices, image metadata,
stock, or orders. Those records are read and written in Supabase Postgres;
uploaded photo files continue to use Supabase Storage.

The seed statements only fill missing products, prices, and default images.
They do not overwrite existing product edits or add another default image
when a product already has one. Existing records that were stored only in a
local SQLite file are not automatically transferred by running the schema.
