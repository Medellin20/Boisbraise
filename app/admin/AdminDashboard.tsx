"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LOG_LENGTHS,
  WOOD_CATEGORIES,
  type CatalogProduct,
  type LogLength,
  type WoodCategory,
} from "../../shared/catalog";

type Order = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  deliveryNotes: string;
  items: Array<{
    name: string;
    category: WoodCategory;
    logLength: LogLength;
    volume: number;
    unitPrice: number;
    total: number;
  }>;
  deliveryFee: number;
  total: number;
  status: "new" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
};

const statusLabels: Record<Order["status"], string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(price);

async function readJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Une erreur est survenue.");
  return result;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    const [catalogResponse, ordersResponse] = await Promise.all([
      fetch("/api/catalog", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ]);
    const [catalog, currentOrders] = await Promise.all([
      readJson<CatalogProduct[]>(catalogResponse),
      readJson<Order[]>(ordersResponse),
    ]);
    setProducts(catalog);
    setOrders(currentOrders);
  };

  useEffect(() => {
    refresh()
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      })
      .finally(() => setLoading(false));
  }, []);

  const saveProduct = async (product: CatalogProduct) => {
    try {
      await readJson(
        await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name,
            description: product.description,
            category: product.category,
            stock: product.stock,
            prices: product.prices,
          }),
        }),
      );
      await refresh();
      toast.success("Produit et tarifs enregistrés.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Enregistrement impossible.",
      );
    }
  };

  const uploadImage = async (
    product: CatalogProduct,
    file: File,
    replaceImageId?: number,
  ) => {
    const form = new FormData();
    form.set("photo", file);
    form.set(
      "isPrimary",
      String(
        product.images.length === 0 ||
          product.images.some(
            (image) => image.id === replaceImageId && image.isPrimary,
          ),
      ),
    );
    if (replaceImageId !== undefined) {
      form.set("replaceImageId", String(replaceImageId));
    }
    try {
      await readJson(
        await fetch(`/api/admin/products/${product.id}/photos`, {
          method: "POST",
          body: form,
        }),
      );
      await refresh();
      toast.success(replaceImageId ? "Photo remplacée." : "Photo ajoutée.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Envoi impossible.");
    }
  };

  const setPrimaryImage = async (productId: string, imageId: number) => {
    try {
      await readJson(
        await fetch(`/api/admin/products/${productId}/photos/${imageId}`, {
          method: "PATCH",
        }),
      );
      await refresh();
      toast.success("Image principale mise à jour.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    }
  };

  const removeImage = async (productId: string, imageId: number) => {
    if (!window.confirm("Supprimer définitivement cette photo ?")) return;
    try {
      await readJson(
        await fetch(`/api/admin/products/${productId}/photos/${imageId}`, {
          method: "DELETE",
        }),
      );
      await refresh();
      toast.success("Photo supprimée.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Suppression impossible.");
    }
  };

  const changeOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await readJson(
        await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: orderId, status }),
        }),
      );
      await refresh();
      toast.success("Statut de commande mis à jour.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Mise à jour impossible.");
    }
  };

  const updateProduct = (
    productId: string,
    update: (product: CatalogProduct) => CatalogProduct,
  ) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? update(product) : product,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-4 py-8 text-[#25221e] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="text-sm font-semibold text-[#52684b] hover:underline">
          ← Retour au catalogue
        </a>
        <header className="mt-7 flex flex-col justify-between gap-5 border-b border-[#ded5c8] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#52684b]">
              Administration
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
              Gestion de l’activité
            </h1>
          </div>
          <p className="max-w-lg rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            Attention : l’administration n’est pas protégée par un compte. Toute
            personne connaissant cette adresse peut modifier les tarifs, les
            photos et les commandes.
          </p>
        </header>

        <div className="mt-7 flex gap-2 border-b border-[#ded5c8]">
          {([
            ["catalog", "Catalogue & tarifs"],
            ["orders", `Commandes (${orders.length})`],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-bold ${
                activeTab === tab
                  ? "border-[#52684b] text-[#40563a]"
                  : "border-transparent text-[#82786b]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}
        {loading ? (
          <p className="py-12 text-sm text-[#766e62]">Chargement des données…</p>
        ) : activeTab === "catalog" ? (
          <section className="space-y-7 py-7" aria-label="Catalogue et tarifs">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold">Tarifs</h2>
                <p className="mt-1 text-sm text-[#82786b]">
                  Prix au m³ (1 m³ = 1 stère), par longueur de bûche.
                </p>
              </div>
            </div>

            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-[#e3d9ca] bg-[#fbf7ef] shadow-sm"
              >
                <form
                  className="grid gap-5 p-5 lg:grid-cols-[minmax(220px,.7fr)_1.5fr_auto] lg:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveProduct(product);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <label className="text-xs font-bold text-[#63594d]">
                      Nom
                      <input
                        required
                        maxLength={100}
                        value={product.name}
                        onChange={(event) =>
                          updateProduct(product.id, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#63594d]">
                      Essence
                      <select
                        value={product.category}
                        onChange={(event) =>
                          updateProduct(product.id, (current) => ({
                            ...current,
                            category: event.target.value as WoodCategory,
                          }))
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                      >
                        {WOOD_CATEGORIES.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-xs font-bold text-[#63594d] sm:col-span-2 lg:col-span-3">
                      Description
                      <textarea
                        required
                        maxLength={500}
                        rows={2}
                        value={product.description}
                        onChange={(event) =>
                          updateProduct(product.id, (current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#ded2c1] bg-white px-3 py-2 text-sm font-medium"
                      />
                    </label>
                    {LOG_LENGTHS.map((length) => (
                      <label
                        key={length}
                        className="text-xs font-bold text-[#63594d]"
                      >
                        {length} · €/m³
                        <input
                          required
                          type="number"
                          min="0"
                          max="100000"
                          step="0.01"
                          value={product.prices[length]}
                          onChange={(event) =>
                            updateProduct(product.id, (current) => ({
                              ...current,
                              prices: {
                                ...current.prices,
                                [length]: Number(event.target.value),
                              },
                            }))
                          }
                          className="mt-1.5 h-10 w-full rounded-lg border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                        />
                      </label>
                    ))}
                    <label className="text-xs font-bold text-[#63594d]">
                      Stock disponible (m³)
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.1"
                        value={product.stock}
                        onChange={(event) =>
                          updateProduct(product.id, (current) => ({
                            ...current,
                            stock: Number(event.target.value),
                          }))
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-[#52684b] px-5 text-sm font-bold text-white hover:bg-[#41543b]"
                  >
                    Enregistrer
                  </button>
                </form>

                <div className="border-t border-[#e9dfd1] bg-[#f8f3e9] p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Photos de {product.name}</h3>
                      <p className="mt-1 text-xs text-[#82786b]">
                        JPEG, PNG ou WebP · 5 Mo maximum
                      </p>
                    </div>
                    <label className="cursor-pointer rounded-full border border-[#cfc4b5] bg-white px-4 py-2 text-xs font-bold text-[#52684b] hover:bg-[#f2ede3]">
                      Ajouter une photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadImage(product, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {product.images.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#d8ccbb] p-6 text-center text-sm text-[#82786b]">
                      Aucune photo. Ajoutez-en une pour l’afficher au catalogue.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {product.images.map((image) => (
                        <div
                          key={image.id}
                          className="overflow-hidden rounded-xl border border-[#ded5c8] bg-white"
                        >
                          <div className="relative">
                            <img
                              src={image.path}
                              alt={product.name}
                              className="h-40 w-full object-cover"
                            />
                            {image.path.startsWith(
                              "/images/wood/prototypes/",
                            ) && (
                              <span className="absolute bottom-2 right-2 rounded-full bg-[#302a23]/85 px-2.5 py-1 text-[10px] font-bold text-white">
                                Visuel prototype
                              </span>
                            )}
                            {image.isPrimary && (
                              <span className="absolute left-2 top-2 rounded-full bg-[#e9efdf] px-2.5 py-1 text-[10px] font-bold text-[#536548]">
                                Image principale
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 p-3">
                            <label className="cursor-pointer rounded-full border border-[#ded5c8] px-3 py-1.5 text-[11px] font-semibold">
                              Remplacer
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    void uploadImage(product, file, image.id);
                                  }
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                            {!image.isPrimary && (
                              <button
                                type="button"
                                onClick={() =>
                                  void setPrimaryImage(product.id, image.id)
                                }
                                className="rounded-full border border-[#ded5c8] px-3 py-1.5 text-[11px] font-semibold"
                              >
                                Image principale
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void removeImage(product.id, image.id)}
                              className="rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-700"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="space-y-4 py-7" aria-label="Commandes reçues">
            <div>
              <h2 className="font-display text-3xl font-semibold">Commandes</h2>
              <p className="mt-1 text-sm text-[#82786b]">
                Nouvelles demandes, coordonnées de livraison et suivi.
              </p>
            </div>
            {orders.length === 0 ? (
              <p className="rounded-2xl border border-[#e3d9ca] bg-[#fbf7ef] p-8 text-sm text-[#82786b]">
                Aucune commande pour le moment.
              </p>
            ) : (
              orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-[#e3d9ca] bg-[#fbf7ef] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{order.customerName}</p>
                      <p className="mt-1 text-sm text-[#766e62]">
                        {order.phone} · {order.email}
                      </p>
                      <p className="mt-1 text-sm text-[#766e62]">
                        {order.address}, {order.postalCode}
                      </p>
                      {order.deliveryNotes && (
                        <p className="mt-1 text-sm text-[#766e62]">
                          Note : {order.deliveryNotes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold">
                        {formatPrice(order.total)}
                      </p>
                      <p className="mt-1 text-xs text-[#82786b]">
                        {new Date(order.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 border-t border-[#e9dfd1] pt-4">
                    {order.items.map((item, index) => (
                      <li
                        key={`${item.name}-${item.logLength}-${index}`}
                        className="flex flex-wrap justify-between gap-2 text-sm"
                      >
                        <span>
                          {item.name} · {item.logLength} · {item.volume} m³
                        </span>
                        <span className="font-semibold">
                          {formatPrice(item.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between border-t border-[#e9dfd1] pt-3 text-sm">
                    <span className="text-[#766e62]">Livraison</span>
                    <span className="font-semibold">
                      {order.deliveryFee === 0
                        ? "Offerte"
                        : formatPrice(order.deliveryFee)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e9dfd1] pt-4">
                    <span className="rounded-full bg-[#e9efdf] px-3 py-1.5 text-xs font-bold text-[#536548]">
                      {statusLabels[order.status]}
                    </span>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#63594d]">
                      Statut
                      <select
                        value={order.status}
                        onChange={(event) =>
                          void changeOrderStatus(
                            order.id,
                            event.target.value as Order["status"],
                          )
                        }
                        className="h-10 rounded-lg border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                      >
                        {Object.entries(statusLabels).map(([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
