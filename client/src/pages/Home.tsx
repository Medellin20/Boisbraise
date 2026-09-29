import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  LOG_LENGTHS,
  WOOD_CATEGORIES,
  type CatalogProduct,
  type LogLength,
} from "@shared/catalog";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  Flame,
  Leaf,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  X,
  Zap,
} from "lucide-react";

type Product = CatalogProduct;

type CartLine = Product & {
  logLength: LogLength;
  volume: number;
  unitPrice: number;
};

const categories = ["Toutes les essences", ...WOOD_CATEGORIES];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);

const formatVolume = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [activeCategory, setActiveCategory] = useState("Toutes les essences");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    id: string;
    total: number;
    deliveryFee: number;
  } | null>(null);
  const [checkoutDetails, setCheckoutDetails] = useState({
    customerName: "",
    phone: "",
    email: "",
    postalCode: "",
    address: "",
    deliveryNotes: "",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [volume, setVolume] = useState(2);
  const [selectedLengths, setSelectedLengths] = useState<
    Record<string, LogLength>
  >({});
  const [selectedVolumes, setSelectedVolumes] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/catalog", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Le catalogue n’a pas pu être chargé (${response.status}).`);
        }
        return (await response.json()) as Product[];
      })
      .then(setProducts)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        const message =
          error instanceof Error
            ? error.message
            : "Une erreur inconnue a empêché le chargement du catalogue.";
        setCatalogError(message);
        toast.error("Impossible de charger le catalogue", { description: message });
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCatalogLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filteredProducts = useMemo(
    () =>
      activeCategory === "Toutes les essences"
        ? products
        : products.filter((product) => product.category === activeCategory),
    [activeCategory, products],
  );

  const cartCount = cart.length;
  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.volume,
    0,
  );
  const delivery = subtotal >= 150 || subtotal === 0 ? 0 : 12;
  const total = subtotal + delivery;

  const addToCart = (
    product: Product,
    logLength: LogLength,
    selectedVolume: number,
  ) => {
    if (!Number.isFinite(selectedVolume) || selectedVolume <= 0) {
      toast.error("Choisissez une quantité supérieure à 0 m³.");
      return;
    }
    const alreadySelected = cart
      .filter((line) => line.id === product.id)
      .reduce((sum, line) => sum + line.volume, 0);
    if (alreadySelected + selectedVolume > product.stock) {
      toast.error(`Stock disponible : ${formatVolume(product.stock)} m³.`);
      return;
    }

    const unitPrice = product.prices[logLength];
    setCart((current) => {
      const existing = current.find(
        (line) => line.id === product.id && line.logLength === logLength,
      );
      if (existing) {
        return current.map((line) =>
          line.id === product.id && line.logLength === logLength
            ? { ...line, volume: line.volume + selectedVolume }
            : line,
        );
      }
      return [...current, { ...product, logLength, volume: selectedVolume, unitPrice }];
    });
    toast.success(`${product.name} ajouté au panier`, {
      description: `${formatVolume(selectedVolume)} m³ · ${logLength}`,
    });
  };

  const updateQuantity = (id: string, logLength: LogLength, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.id === id && line.logLength === logLength
            ? {
                ...line,
                volume: Math.max(
                  0,
                  Math.min(
                    products.find((product) => product.id === id)?.stock ??
                      line.volume + delta,
                    Math.round((line.volume + delta) * 10) / 10,
                  ),
                ),
              }
            : line,
        )
        .filter((line) => line.volume > 0),
    );
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cart.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkoutDetails,
          items: cart.map((line) => ({
            productId: line.id,
            logLength: line.logLength,
            volume: line.volume,
          })),
        }),
      });
      const result = (await response.json()) as {
        orderId?: string;
        total?: number;
        deliveryFee?: number;
        error?: string;
      };
      if (
        !response.ok ||
        !result.orderId ||
        result.total === undefined ||
        result.deliveryFee === undefined
      ) {
        throw new Error(result.error ?? "La commande n’a pas pu être enregistrée.");
      }
      setOrderConfirmation({
        id: result.orderId,
        total: result.total,
        deliveryFee: result.deliveryFee,
      });
      setCart([]);
      toast.success("Votre commande a été transmise.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "La commande n’a pas pu être enregistrée.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const checkDelivery = () => {
    if (postalCode.length < 5) {
      toast.error("Bitte geben Sie eine 5-stellige Postleitzahl ein.");
      return;
    }
    toast.success("Gute Nachrichten: Wir liefern zu Ihnen.", {
      description: `Voraussichtlicher Liefertermin innerhalb von 48 Std. für ${postalCode}.`,
    });
  };

  const scrollToShop = () => {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };
  const estimateProduct = products.find((product) => product.id === "hetre");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f1e8] text-[#25221e]">
      <div className="bg-[#28241f] px-4 py-2.5 text-center text-[11px] font-medium tracking-[0.16em] text-[#f4ead8] uppercase sm:text-xs">
        Kostenlose Lieferung ab 150 € · Garantiert trockenes Holz · Sicher bezahlen
      </div>

      <header className="relative z-20 border-b border-[#e7dfd1] bg-[#f5f1e8]/95 backdrop-blur-xl">
        <div className="container flex h-[74px] items-center justify-between gap-5">
          <a className="group flex items-center gap-3" href="#top" aria-label="Holz & Glut, accueil">
            <span className="relative grid size-10 place-items-center rounded-full bg-[#302a23] text-[#f9b34f] shadow-[0_7px_18px_rgba(48,42,35,.16)] transition-transform duration-200 group-hover:-rotate-6">
              <Flame size={20} strokeWidth={2.2} fill="currentColor" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#ef6b38]" />
            </span>
            <span className="font-display text-[18px] font-semibold tracking-[-0.04em] text-[#2f2a25] sm:text-[21px]">
              Holz <span className="text-[#d45f32]">&</span> Glut
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#716a60] lg:flex">
            <a className="text-[#2f2a25] transition-colors hover:text-[#c4592f]" href="#shop">Holz</a>
            <a className="transition-colors hover:text-[#c4592f]" href="#engagement">Unser Holzhandwerk</a>
            <a className="transition-colors hover:text-[#c4592f]" href="#delivery">Lieferung</a>
            <a className="transition-colors hover:text-[#c4592f]" href="/admin">Administration</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button className="hidden size-10 place-items-center rounded-full text-[#625b51] transition hover:bg-[#eae1d3] hover:text-[#2f2a25] sm:grid" aria-label="Rechercher">
              <Search size={19} strokeWidth={1.8} />
            </button>
            <button
              className="relative grid size-10 place-items-center rounded-full bg-[#302a23] text-[#f9f0e3] transition duration-200 hover:bg-[#4b4034] active:scale-95"
              aria-label="Ouvrir le panier"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={18} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#e36a37] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="grid size-10 place-items-center rounded-full border border-[#ddd3c4] text-[#625b51] transition hover:bg-[#eae1d3] lg:hidden"
              aria-label="Ouvrir le menu"
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="border-t border-[#e7dfd1] bg-[#f5f1e8] px-5 py-5 lg:hidden">
            <div className="container flex flex-col gap-4 text-sm font-medium text-[#625b51]">
              <a href="#shop" onClick={() => setIsMenuOpen(false)}>Holz</a>
              <a href="#engagement" onClick={() => setIsMenuOpen(false)}>Unser Holzhandwerk</a>
              <a href="#delivery" onClick={() => setIsMenuOpen(false)}>Lieferung</a>
              <a href="/admin" onClick={() => setIsMenuOpen(false)}>Administration</a>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="container grid gap-8 pb-16 pt-9 sm:pb-24 sm:pt-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(440px,.98fr)] lg:items-center lg:gap-14 lg:pt-14">
          <div className="relative z-10 max-w-[670px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e6d8c5] bg-[#fbf7ef] px-3.5 py-2 text-[11px] font-bold tracking-[0.17em] text-[#a45c35] uppercase shadow-sm">
              <span className="size-1.5 rounded-full bg-[#e36a37] shadow-[0_0_0_4px_rgba(227,106,55,.12)]" />
              Heizsaison · 2024–2025
            </div>
            <h1 className="font-display max-w-[740px] text-[clamp(3.2rem,7.2vw,6.6rem)] leading-[.9] font-semibold tracking-[-0.075em] text-[#302a23]">
              Wärme
              <br />
              <span className="text-[#d26035]">beginnt hier.</span>
            </h1>
            <p className="mt-7 max-w-[500px] text-[17px] leading-7 text-[#766e62] sm:text-[19px] sm:leading-8">
              Gut getrocknetes Holz, direkt zu Ihnen nach Hause. Sorgfältig ausgewählt und vorbereitet für lange Winterabende.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={scrollToShop}
                className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#d26035] px-7 text-sm font-bold text-white shadow-[0_12px_25px_rgba(210,96,53,.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#bd522c] active:scale-[.98]"
              >
                Holz auswählen
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#engagement" className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-[#5e574e] transition hover:bg-[#ebe2d4]">
                Warum wir?
                <ChevronRight size={16} />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-[#82786b]">
              <span className="inline-flex items-center gap-2"><BadgeCheck size={16} className="text-[#7d8a60]" /> PEFC-zertifiziertes Holz</span>
              <span className="inline-flex items-center gap-2"><Truck size={16} className="text-[#d26035]" /> Lieferung in 48 Std.</span>
            </div>
          </div>

          <div className="relative min-h-[370px] overflow-hidden rounded-[30px] bg-[#43372b] shadow-[0_24px_60px_rgba(67,50,32,.18)] sm:min-h-[470px] lg:min-h-[560px] lg:rounded-[36px]">
            <img
              src="/images/wood/oak-logs.jpg"
              alt="Brennholz in warmer Atmosphäre"
              className="absolute inset-0 size-full object-cover transition duration-700 hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#342920]/50 via-transparent to-[#1f1a15]/65" />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-[#f8f0e4]/90 px-3.5 py-2 text-[11px] font-bold tracking-[.12em] text-[#493c30] uppercase shadow-lg backdrop-blur sm:left-7 sm:top-7">
              <Leaf size={14} className="text-[#7d8a60]" /> Aus der Region
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-[22px] border border-white/20 bg-[#2c241d]/72 p-5 text-[#fff9ee] backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7 sm:p-6">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Ein Feuer. Ganz einfach.</p>
                  <p className="mt-2 max-w-[250px] text-xs leading-5 text-[#e6d8c7]">Ausgewählte Holzarten für saubere, lang anhaltende Wärme.</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f4ad4b] text-[#33281e]"><Flame size={20} fill="currentColor" /></span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e8dfd1] bg-[#efe8dc]" id="delivery">
          <div className="container grid gap-6 py-8 sm:grid-cols-3 sm:gap-8 sm:py-9">
            <div className="flex items-center gap-4 sm:border-r sm:border-[#d9cebd]">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f8f2e7] text-[#d26035]"><Truck size={20} /></span>
              <div><p className="text-sm font-bold text-[#383129]">Sorgfältige Lieferung</p><p className="mt-0.5 text-xs text-[#84796b]">Deutschlandweit & in Ihrer Region</p></div>
            </div>
            <div className="flex items-center gap-4 sm:border-r sm:border-[#d9cebd] sm:pl-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f8f2e7] text-[#7d8a60]"><ShieldCheck size={20} /></span>
              <div><p className="text-sm font-bold text-[#383129]">Garantiert trocken</p><p className="mt-0.5 text-xs text-[#84796b]">Kontrollierte Restfeuchte</p></div>
            </div>
            <div className="flex items-center gap-4 sm:pl-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f8f2e7] text-[#d26035]"><Clock3 size={20} /></span>
              <div><p className="text-sm font-bold text-[#383129]">Präziser Liefertermin</p><p className="mt-0.5 text-xs text-[#84796b]">Sie wählen Ihren Wunschtermin</p></div>
            </div>
          </div>
          <div className="container pb-8 sm:pb-10">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#ded2c1] bg-[#f8f2e7] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div><p className="text-sm font-bold text-[#40382f]">Liefern wir zu Ihnen?</p><p className="mt-1 text-xs text-[#887b6b]">Postleitzahl eingeben und Liefertermin prüfen.</p></div>
              <div className="flex w-full max-w-[340px] gap-2"><input value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" placeholder="Ihre Postleitzahl" aria-label="Code postal de livraison" className="h-11 min-w-0 flex-1 rounded-full border border-[#dacdbb] bg-[#fffaf1] px-4 text-sm text-[#40382f] outline-none transition placeholder:text-[#b1a392] focus:border-[#d26035] focus:ring-2 focus:ring-[#d26035]/15" /><button onClick={checkDelivery} className="h-11 shrink-0 rounded-full bg-[#302a23] px-4 text-xs font-bold text-[#fff8ed] transition hover:bg-[#4b4034] active:scale-[.98]">Prüfen</button></div>
            </div>
          </div>
        </section>

        <section className="container scroll-mt-8 py-20 sm:py-28" id="shop">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold tracking-[.2em] text-[#d26035] uppercase">Das Sortiment</p>
              <h2 className="font-display mt-3 text-4xl font-semibold tracking-[-.055em] text-[#302a23] sm:text-5xl">Für jedes Feuer das richtige Holz.</h2>
              <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-[#82786b]">Regionale Holzarten, praktische Formate und ein klares Versprechen: zuverlässiges Holz zum fairen Preis.</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <SlidersHorizontal size={16} className="mr-1 shrink-0 text-[#9b8e7d]" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition ${activeCategory === category ? "bg-[#302a23] text-[#fff8ed] shadow-md" : "border border-[#e1d7c9] bg-[#faf5ed] text-[#7e7365] hover:border-[#c8b9a6] hover:text-[#302a23]"}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isCatalogLoading && (
              <p className="col-span-full rounded-2xl border border-[#e3d9ca] bg-[#fbf7ef] p-6 text-sm text-[#766e62]">
                Chargement des tarifs et des produits…
              </p>
            )}
            {catalogError && (
              <p
                role="alert"
                className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
              >
                {catalogError}
              </p>
            )}
            {!isCatalogLoading && !catalogError && filteredProducts.length === 0 && (
              <p className="col-span-full rounded-2xl border border-[#e3d9ca] bg-[#fbf7ef] p-6 text-sm text-[#766e62]">
                Aucun produit disponible pour cette catégorie.
              </p>
            )}
            {filteredProducts.map((product, index) => {
              const logLength = selectedLengths[product.id] ?? "33 cm";
              const selectedVolume = selectedVolumes[product.id] ?? 1;
              const primaryImage =
                product.images.find((image) => image.isPrimary)?.path ??
                product.images[0]?.path;

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[24px] border border-[#e7ddcf] bg-[#fbf7ef] shadow-[0_8px_24px_rgba(74,57,38,.04)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_38px_rgba(74,57,38,.11)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative h-64 overflow-hidden bg-[#d7c7b4]">
                    {primaryImage && (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-[#fff8ed]/95 px-3 py-1.5 text-xs font-bold text-[#52684b] shadow-sm">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-.04em] text-[#352e27]">
                          {product.name}
                        </h3>
                        <p className="mt-2 min-h-10 text-sm leading-5 text-[#8b7e6f]">
                          {product.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl font-bold text-[#352e27]">
                          {formatPrice(product.prices[logLength])}
                        </p>
                        <p className="text-[10px] text-[#9a8d7e]">/ m³ · stère</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        { label: "Bois sec < 20 %", icon: BadgeCheck },
                        { label: "Livraison disponible", icon: Truck },
                        { label: "Haute performance calorifique", icon: Zap },
                        {
                          label: product.stock > 0 ? "En stock" : "Rupture de stock",
                          icon: PackageCheck,
                        },
                      ].map(({ label, icon: Icon }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#e9efdf] px-2.5 py-1.5 text-[10px] font-semibold text-[#536548]"
                        >
                          <Icon size={12} />
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-[#e9dfd1] pt-4 sm:grid-cols-2">
                      <label className="text-xs font-bold text-[#63594d]">
                        Longueur des bûches
                        <select
                          value={logLength}
                          onChange={(event) =>
                            setSelectedLengths((current) => ({
                              ...current,
                              [product.id]: event.target.value as LogLength,
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium text-[#40382f] outline-none focus:border-[#52684b] focus:ring-2 focus:ring-[#52684b]/15"
                        >
                          {LOG_LENGTHS.map((length) => (
                            <option key={length} value={length}>
                              {length}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-bold text-[#63594d]">
                        Quantité (m³)
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={selectedVolume}
                          onChange={(event) =>
                            setSelectedVolumes((current) => ({
                              ...current,
                              [product.id]: Number(event.target.value),
                            }))
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium text-[#40382f] outline-none focus:border-[#52684b] focus:ring-2 focus:ring-[#52684b]/15"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f2ede3] px-3.5 py-3">
                      <span className="text-xs font-medium text-[#766e62]">
                        Total · {formatVolume(selectedVolume)} m³
                      </span>
                      <span className="font-display text-lg font-bold text-[#352e27]">
                        {formatPrice(
                          product.prices[logLength] *
                            (Number.isFinite(selectedVolume) ? selectedVolume : 0),
                        )}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-[#8b7e6f]">
                      1 m³ = 1 stère
                    </p>

                    <button
                      onClick={() =>
                        addToCart(product, logLength, selectedVolume)
                      }
                      disabled={product.stock <= 0 || selectedVolume <= 0}
                      className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#52684b] text-sm font-bold text-white transition hover:bg-[#41543b] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Ajouter au panier <Plus size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="container pb-20 sm:pb-28" id="engagement">
          <div className="grid overflow-hidden rounded-[30px] bg-[#302a23] text-[#fff8ed] shadow-[0_22px_55px_rgba(51,38,26,.16)] lg:grid-cols-[.85fr_1.15fr]">
            <div className="relative min-h-[300px] overflow-hidden bg-[#6f4c35] lg:min-h-[420px]">
              <img src="/images/wood/oak-logs.jpg" alt="Regionaler Laubwald" className="absolute inset-0 size-full object-cover opacity-75 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#543b2b]/30 to-[#302a23]/70" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8"><span className="font-display text-2xl font-semibold tracking-[-.04em]">Vom Wald bis zu Ihrem Ofen.</span><span className="grid size-12 place-items-center rounded-full bg-[#f4ad4b] text-[#34281c]"><Leaf size={20} /></span></div>
            </div>
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-xs font-bold tracking-[.2em] text-[#f4ad4b] uppercase">Unser Unterschied</p>
              <h2 className="font-display mt-4 max-w-[500px] text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-5xl">Kein grünes Holz.<br /><span className="text-[#e5a354]">Keine bösen Überraschungen.</span></h2>
              <p className="mt-6 max-w-[530px] text-[15px] leading-7 text-[#c8bdae]">Wir arbeiten mit regionalen Sägewerken und Forstbetrieben, um Holz auszuwählen, das wirklich wärmt. Jede Lieferung wird kontrolliert, ordentlich abgelegt und verständlich erklärt.</p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="border-t border-white/15 pt-4"><p className="font-display text-3xl font-semibold text-[#f7d59e]">&lt; 20%</p><p className="mt-1 text-xs leading-5 text-[#b8ab9c]">Restfeuchte bei Lieferung</p></div>
                <div className="border-t border-white/15 pt-4"><p className="font-display text-3xl font-semibold text-[#f7d59e]">100%</p><p className="mt-1 text-xs leading-5 text-[#b8ab9c]">Holz aus nachhaltig bewirtschafteten Wäldern</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#e7ddcf] bg-[#efe8dc] py-16 sm:py-20">
          <div className="container grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-bold tracking-[.2em] text-[#d26035] uppercase">Brauchen Sie Hilfe?</p><h2 className="font-display mt-3 max-w-[520px] text-4xl font-semibold leading-[1] tracking-[-.055em] text-[#302a23]">Wie viel Holz brauchen Sie wirklich?</h2><p className="mt-4 max-w-[460px] text-[15px] leading-7 text-[#82786b]">Mit unserem einfachen Rechner planen Sie Ihre Heizsaison ohne zu viel zu bestellen.</p></div>
            <div className="rounded-[24px] border border-[#e0d5c6] bg-[#faf5ed] p-6 shadow-[0_12px_30px_rgba(74,57,38,.05)] sm:p-8">
              <div className="flex items-center justify-between"><span className="text-sm font-bold text-[#40382f]">Ihre Schätzung</span><span className="rounded-full bg-[#e9ddc9] px-3 py-1.5 text-xs font-bold text-[#705e4b]">{volume} m³ · stères</span></div>
              <input type="range" min="1" max="6" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="mt-7 h-2 w-full cursor-pointer accent-[#d26035]" aria-label="Quantité en mètres cubes" />
              <div className="mt-2 flex justify-between text-[10px] font-semibold text-[#a09383]"><span>1 m³</span><span>6 m³</span></div>
              <div className="mt-7 flex items-center justify-between border-t border-[#e6dac9] pt-5"><div><p className="text-xs text-[#8f8273]">À partir de</p><p className="font-display text-3xl font-bold tracking-[-.05em] text-[#302a23]">{formatPrice(volume * (estimateProduct?.prices["33 cm"] ?? 0))}</p></div><button disabled={!estimateProduct} onClick={() => { if (estimateProduct) { addToCart(estimateProduct, "33 cm", volume); setIsCartOpen(true); } }} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#302a23] px-5 text-xs font-bold text-[#fff8ed] transition hover:bg-[#4b4034] active:scale-[.98] disabled:opacity-50">Warenkorb ansehen <ArrowRight size={15} /></button></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#302a23] text-[#fff8ed]">
        <div className="container flex flex-col gap-7 py-10 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#f4ad4b] text-[#34281c]"><Flame size={18} fill="currentColor" /></span><span className="font-display text-xl font-semibold tracking-[-.04em]">Holz <span className="text-[#ef8c48]">&</span> Glut</span></div><p className="mt-3 text-xs text-[#b9aa99]">Das richtige Holz für besondere Momente.</p></div><div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#c8bdae]"><a href="#shop" className="transition hover:text-white">Sortiment</a><a href="#delivery" className="transition hover:text-white">Lieferung</a><a href="#engagement" className="transition hover:text-white">Unsere Geschichte</a><span className="text-[#867665]">© 2024 Holz & Glut</span></div></div>
      </footer>

      {isCartOpen && <div className="fixed inset-0 z-40 bg-[#211a14]/45 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />}
      <aside className={`fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[430px] flex-col bg-[#fbf7ef] shadow-[-20px_0_50px_rgba(32,23,15,.18)] transition-transform duration-300 ${isCartOpen ? "translate-x-0" : "translate-x-full"}`} aria-label="Panier">
        <div className="flex items-center justify-between border-b border-[#e7ddcf] px-5 py-5 sm:px-7"><div><p className="text-xs font-bold tracking-[.15em] text-[#d26035] uppercase">Ihre Auswahl</p><h2 className="font-display mt-1 text-2xl font-semibold tracking-[-.05em] text-[#302a23]">Der Warenkorb</h2></div><button onClick={() => setIsCartOpen(false)} className="grid size-10 place-items-center rounded-full border border-[#ded2c2] text-[#6f6458] transition hover:bg-[#eee3d4]" aria-label="Fermer le panier"><X size={18} /></button></div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-[#eee3d4] text-[#a68c71]"><ShoppingBag size={25} /></span>
            <h3 className="font-display mt-5 text-2xl font-semibold tracking-[-.04em]">Ihr Warenkorb ist leer</h3>
            <p className="mt-2 text-sm leading-6 text-[#8a7e70]">Legen Sie Holz in den Warenkorb und bereiten Sie das nächste Feuer vor.</p>
            <button onClick={() => { setIsCartOpen(false); scrollToShop(); }} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#d26035] px-5 text-xs font-bold text-white">Holz entdecken <ArrowRight size={15} /></button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
              {cart.map((line) => {
                const image = line.images.find((item) => item.isPrimary)?.path ?? line.images[0]?.path;
                return (
                  <div key={`${line.id}-${line.logLength}`} className="flex gap-4 rounded-2xl border border-[#e9dfd1] bg-white/50 p-3">
                    {image && <img src={image} alt="" className="size-20 rounded-xl object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h3 className="truncate text-sm font-bold text-[#3c342b]">{line.name}</h3>
                          <p className="mt-1 text-[11px] text-[#8f8273]">{line.logLength} · {formatPrice(line.unitPrice)} / m³</p>
                        </div>
                        <p className="text-sm font-bold text-[#3c342b]">{formatPrice(line.unitPrice * line.volume)}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => updateQuantity(line.id, line.logLength, -0.1)} className="grid size-7 place-items-center rounded-full border border-[#ddd2c2] text-[#675b4e] hover:bg-[#ede3d5]" aria-label="Retirer 0,1 m³"><Minus size={13} /></button>
                        <span className="min-w-12 text-center text-xs font-bold">{formatVolume(line.volume)} m³</span>
                        <button onClick={() => updateQuantity(line.id, line.logLength, 0.1)} className="grid size-7 place-items-center rounded-full border border-[#ddd2c2] text-[#675b4e] hover:bg-[#ede3d5]" aria-label="Ajouter 0,1 m³"><Plus size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-[#e7ddcf] bg-[#f6efe3] px-5 py-6 sm:px-7">
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#e7eddc] px-3 py-2.5 text-xs font-semibold text-[#5e7049]"><PackageCheck size={16} /> Kostenlose Lieferung ab 150 €</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#897c6c]"><span>Zwischensumme</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-[#897c6c]"><span>Lieferung</span><span>{delivery === 0 ? "Kostenlos" : formatPrice(delivery)}</span></div>
                <div className="flex justify-between border-t border-[#e1d4c3] pt-3 font-bold text-[#302a23]"><span>Geschätzter Gesamtbetrag</span><span className="font-display text-xl">{formatPrice(total)}</span></div>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setOrderConfirmation(null);
                  setIsCheckoutOpen(true);
                }}
                className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#52684b] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(82,104,75,.2)] transition hover:bg-[#41543b] active:scale-[.98]"
              >
                Livraison et coordonnées <ArrowRight size={16} />
              </button>
              <p className="mt-3 text-center text-[10px] text-[#9a8d7e]">
                Le paiement sera confirmé avec notre équipe après réception de la commande.
              </p>
            </div>
          </>
        )}
      </aside>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#211a14]/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="my-auto w-full max-w-2xl rounded-[26px] border border-[#e3d9ca] bg-[#fbf7ef] p-5 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-[#52684b]">
                  Finaliser la demande
                </p>
                <h2 id="checkout-title" className="font-display mt-1 text-3xl font-semibold">
                  Livraison et coordonnées
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[#ded2c2] text-[#6f6458]"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {orderConfirmation ? (
              <div className="mt-7 rounded-2xl border border-[#d8e1ce] bg-[#edf2e6] p-6">
                <span className="grid size-12 place-items-center rounded-full bg-[#52684b] text-white">
                  <PackageCheck size={22} />
                </span>
                <h3 className="font-display mt-4 text-2xl font-semibold">
                  Merci, votre demande est enregistrée.
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#5e6e52]">
                  Référence <strong>{orderConfirmation.id}</strong> · Total{" "}
                  <strong>{formatPrice(orderConfirmation.total)}</strong>
                  {orderConfirmation.deliveryFee > 0 && (
                    <> (dont {formatPrice(orderConfirmation.deliveryFee)} de livraison)</>
                  )}
                  L’équipe vous contactera pour confirmer la livraison et le paiement.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="mt-5 h-11 rounded-full bg-[#52684b] px-5 text-sm font-bold text-white"
                >
                  Retour au catalogue
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 rounded-xl bg-[#f1ecdf] p-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-[#766e62]">
                      {cart.length} produit{cart.length > 1 ? "s" : ""} ·{" "}
                      {formatVolume(cart.reduce((sum, line) => sum + line.volume, 0))} m³
                    </span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <p className="mt-1 text-xs text-[#82786b]">
                    Tarifs définitifs vérifiés à l’enregistrement.
                  </p>
                </div>
                <form onSubmit={submitOrder} className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-[#63594d]">
                    Nom complet
                    <input
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={checkoutDetails.customerName}
                      onChange={(event) =>
                        setCheckoutDetails((current) => ({
                          ...current,
                          customerName: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#63594d]">
                    Téléphone
                    <input
                      required
                      type="tel"
                      maxLength={30}
                      autoComplete="tel"
                      value={checkoutDetails.phone}
                      onChange={(event) =>
                        setCheckoutDetails((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#63594d] sm:col-span-2">
                    E-mail
                    <input
                      required
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      value={checkoutDetails.email}
                      onChange={(event) =>
                        setCheckoutDetails((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#63594d] sm:col-span-2">
                    Adresse de livraison
                    <input
                      required
                      maxLength={250}
                      autoComplete="street-address"
                      value={checkoutDetails.address}
                      onChange={(event) =>
                        setCheckoutDetails((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#63594d]">
                    Code postal
                    <input
                      required
                      maxLength={12}
                      autoComplete="postal-code"
                      value={checkoutDetails.postalCode}
                      onChange={(event) =>
                        setCheckoutDetails((current) => ({
                          ...current,
                          postalCode: event.target.value,
                        }))
                      }
                      className="mt-1.5 h-11 w-full rounded-xl border border-[#ded2c1] bg-white px-3 text-sm font-medium"
                    />
                  </label>
                  <label className="text-xs font-bold text-[#63594d] sm:col-span-2">
                    Instructions de livraison (facultatif)
                    <textarea
                      maxLength={500}
                      rows={2}
                      value={checkoutDetails.deliveryNotes}
                      onChange={(event) =>
                        setCheckoutDetails((current) => ({
                          ...current,
                          deliveryNotes: event.target.value,
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#ded2c1] bg-white px-3 py-2 text-sm font-medium"
                    />
                  </label>
                  <div className="flex flex-col-reverse gap-3 border-t border-[#e9dfd1] pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-[#82786b]">
                      Aucun paiement en ligne n’est prélevé. La commande sera
                      confirmée par notre équipe.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmittingOrder || cart.length === 0}
                      className="h-12 shrink-0 rounded-full bg-[#52684b] px-6 text-sm font-bold text-white hover:bg-[#41543b] disabled:opacity-50"
                    >
                      {isSubmittingOrder ? "Envoi…" : "Confirmer la demande"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      <div className="fixed bottom-5 left-5 z-30 hidden w-[265px] rounded-2xl border border-[#dfd4c5] bg-[#fbf7ef]/95 p-4 shadow-[0_14px_35px_rgba(73,53,34,.12)] backdrop-blur sm:block"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e8eedf] text-[#718054]"><Zap size={17} fill="currentColor" /></span><div><p className="text-xs font-bold text-[#40372e]">Eine Frage?</p><a href="mailto:hallo@holzundglut.de" className="text-[11px] text-[#8a7e70] hover:text-[#d26035]">hallo@holzundglut.de</a></div><ChevronDown size={14} className="ml-auto text-[#a49684]" /></div></div>
    </div>
  );
}
