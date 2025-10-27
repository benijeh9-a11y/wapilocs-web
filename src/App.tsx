import React, { useEffect, useMemo, useRef, useState } from "react";

// ------------------------------------------------------------
// Wapilocs — Clean v3 (single-file React component)
// - Admin is ALWAYS enabled (no more greyed out)
// - Category icons visible on the home grid
// - Listings displayed per-category (clear sections)
// - Simple bilingual FR/EN toggle
// - Simple "Add Listing" with photo (camera-friendly)
// TailwindCSS recommended (index.css already includes @tailwind)
// ------------------------------------------------------------

// Types
type CategorySlug =
  | "generators"
  | "events"
  | "tools"
  | "transport"
  | "services"
  | "electronics"
  | "heavy_btp"
  | "moving"
  | "resale"; // vente d'objets

type Listing = {
  id: string;
  title: string;
  desc: string;
  price?: number; // optional, for moving/BTP you may leave empty or 0
  phone?: string;
  category: CategorySlug;
  photoUrl?: string; // dataURL for demo
  status?: "available" | "pending" | "confirmed" | "paid_blocked" | "delivered" | "completed" | "refunded";
};

type AppConfig = {
  commissionPct: number;
  currency: string;
  supportPhone?: string;
  language: "fr" | "en";
  visibleCategories: Record<CategorySlug, boolean>;
};

// I18N
const I18N = {
  fr: {
    appName: "Wapilocs",
    slogan: "Louez • Vendez • Dépannez — simple et sécurisé",
    add: "Ajouter une annonce",
    admin: "Admin",
    save: "Enregistrer",
    lang: "Langue",
    category: "Catégorie",
    title: "Titre",
    desc: "Description",
    price: "Prix (par jour)",
    phone: "Téléphone",
    photo: "Photo",
    create: "Créer",
    commission: "Commission (%)",
    currency: "Devise",
    support: "Téléphone Wapilocs",
    categories: "Catégories visibles",
    listingsByCategory: "Annonces par catégorie",
    emptyCat: "Aucune annonce dans cette catégorie pour le moment.",
    // cat labels
    catLabel: {
      generators: "Groupes électrogènes",
      events: "Événementiel",
      tools: "Outils",
      transport: "Transport",
      services: "Services",
      electronics: "Électronique",
      heavy_btp: "BTP / Engins",
      moving: "Déménagement",
      resale: "Vente d'objets",
    } as Record<CategorySlug, string>,
  },
  en: {
    appName: "Wapilocs",
    slogan: "Rent • Sell • Help — simple & secure",
    add: "Add listing",
    admin: "Admin",
    save: "Save",
    lang: "Language",
    category: "Category",
    title: "Title",
    desc: "Description",
    price: "Price (per day)",
    phone: "Phone",
    photo: "Photo",
    create: "Create",
    commission: "Commission (%)",
    currency: "Currency",
    support: "Wapilocs phone",
    categories: "Visible categories",
    listingsByCategory: "Listings by category",
    emptyCat: "No listings in this category yet.",
    catLabel: {
      generators: "Generators",
      events: "Events",
      tools: "Tools",
      transport: "Transport",
      services: "Services",
      electronics: "Electronics",
      heavy_btp: "Construction / Heavy",
      moving: "Moving",
      resale: "Resale",
    } as Record<CategorySlug, string>,
  },
};

// Category icon (emoji for simplicity — can be replaced by SVG later)
const CAT_ICON: Record<CategorySlug, string> = {
  generators: "🔌",
  events: "🎉",
  tools: "🛠️",
  transport: "🚗",
  services: "🤝",
  electronics: "📺",
  heavy_btp: "🏗️",
  moving: "🚚",
  resale: "🛒",
};

// Default config (Admin can change live)
const DEFAULT_CONFIG: AppConfig = {
  commissionPct: 15,
  currency: "FC",
  supportPhone: "",
  language: "fr",
  visibleCategories: {
    generators: true,
    events: true,
    tools: true,
    transport: true,
    services: true,
    electronics: true,
    heavy_btp: true,
    moving: true,
    resale: true,
  },
};

// Helpers
const uid = () => Math.random().toString(36).slice(2, 9);

function formatPrice(n?: number, cur = "FC") {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) + " " + cur;
}

// MAIN COMPONENT
export default function App(){
  // Admin ALWAYS enabled
  const [isAdmin, setIsAdmin] = useState(true);

  // Config stored in localStorage so changes persist
  const [config, setConfig] = useState<AppConfig>(()=>{
    try{
      const raw = localStorage.getItem("wapilocs:config");
      return raw ? JSON.parse(raw) as AppConfig : DEFAULT_CONFIG;
    }catch{ return DEFAULT_CONFIG; }
  });
  useEffect(()=>{ localStorage.setItem("wapilocs:config", JSON.stringify(config)); }, [config]);

  const [lang, setLang] = useState<"fr"|"en">(config.language);
  useEffect(()=>{ setConfig(c=> ({...c, language: lang})); }, [lang]);
  const t = I18N[lang];

  // Listings
  const [listings, setListings] = useState<Listing[]>(()=>{
    try{
      const raw = localStorage.getItem("wapilocs:listings");
      return raw ? JSON.parse(raw) as Listing[] : [];
    }catch{ return []; }
  });
  useEffect(()=>{ localStorage.setItem("wapilocs:listings", JSON.stringify(listings)); }, [listings]);

  // New listing form state
  const [newItem, setNewItem] = useState<Partial<Listing>>({ category: "generators" });
  const fileRef = useRef<HTMLInputElement|null>(null);

  // Derived: categories in display order
  const visibleCats = useMemo(()=> Object.entries(config.visibleCategories)
    .filter(([,on])=> !!on)
    .map(([slug])=> slug as CategorySlug), [config]);

  const listingsByCat = useMemo(()=>{
    const map: Record<CategorySlug, Listing[]> = {
      generators: [], events: [], tools: [], transport: [], services: [], electronics: [], heavy_btp: [], moving: [], resale: []
    };
    for(const it of listings){
      if(config.visibleCategories[it.category]) map[it.category].push(it);
    }
    return map;
  }, [listings, config.visibleCategories]);

  // Handlers
  function handleCreateListing(){
    const title = (newItem.title||"").trim();
    const category = (newItem.category||"generators") as CategorySlug;
    if(!title){ alert(lang==='fr'?'Titre requis':'Title required'); return; }
    const item: Listing = {
      id: uid(),
      title,
      desc: (newItem.desc||'').trim(),
      price: newItem.price && Number(newItem.price) >= 0 ? Number(newItem.price) : undefined,
      phone: (newItem.phone||'').trim(),
      category,
      photoUrl: newItem.photoUrl,
      status: 'available',
    };
    setListings(prev=> [item, ...prev]);
    setNewItem({ category });
    if(fileRef.current) fileRef.current.value = "";
  }

  async function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => setNewItem(v=> ({...v, photoUrl: String(reader.result)}));
    reader.readAsDataURL(f);
  }

  // UI bits
  function CatBadge({ slug }:{slug:CategorySlug}){
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300 text-emerald-800 bg-emerald-50">
        <span className="text-xl leading-none">{CAT_ICON[slug]}</span>
        <span className="text-sm">{t.catLabel[slug]}</span>
      </div>
    );
  }

  function ListingCard({ it }:{it: Listing}){
    return (
      <div className="border rounded-2xl p-3 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <CatBadge slug={it.category} />
          <div className="text-sm opacity-60">{formatPrice(it.price, config.currency)}</div>
        </div>
        {it.photoUrl && (
          <div className="mt-2">
            <img src={it.photoUrl} alt={it.title} className="w-full h-44 object-cover rounded-xl"/>
          </div>
        )}
        <div className="mt-2 font-semibold">{it.title}</div>
        {it.desc && <div className="text-sm text-slate-600 mt-1">{it.desc}</div>}
        {it.phone && (
          <div className="mt-2">
            <a href={`tel:${it.phone}`} className="text-sm px-3 py-1 rounded-lg border border-slate-300">{t.phone}: {it.phone}</a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl grid place-items-center bg-emerald-600 text-white text-lg">W</div>
            <div className="font-bold">{t.appName}</div>
            <div className="hidden md:block text-slate-500 text-sm">{t.slogan}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=> setLang(l=> l==='fr'?'en':'fr')} className="px-3 py-1 rounded-lg border">{t.lang}: {lang.toUpperCase()}</button>
            <button className="px-3 py-1 rounded-lg border border-emerald-600 text-emerald-700">{t.admin}</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Add listing */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{t.add}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm">{t.category}</label>
              <div className="flex flex-wrap gap-2">
                {visibleCats.map(slug => (
                  <button key={slug}
                    onClick={()=> setNewItem(v=> ({...v, category: slug}))}
                    className={`px-3 py-1 rounded-full border ${newItem.category===slug? 'bg-emerald-600 text-white border-emerald-600':'border-slate-300'}`}>
                    <span className="mr-1">{CAT_ICON[slug as CategorySlug]}</span>
                    {t.catLabel[slug as CategorySlug]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm">{t.title}</label>
              <input className="border rounded-lg px-3 py-2" value={newItem.title||""} onChange={e=> setNewItem(v=> ({...v, title: e.target.value}))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">{t.desc}</label>
              <textarea className="border rounded-lg px-3 py-2" rows={3} value={newItem.desc||""} onChange={e=> setNewItem(v=> ({...v, desc: e.target.value}))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">{t.price}</label>
              <input type="number" className="border rounded-lg px-3 py-2" value={(newItem.price as any)||""} onChange={e=> setNewItem(v=> ({...v, price: Number(e.target.value)}))} placeholder={lang==='fr'? 'ex: 10000':'e.g. 10000'} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">{t.phone}</label>
              <input className="border rounded-lg px-3 py-2" value={newItem.phone||""} onChange={e=> setNewItem(v=> ({...v, phone: e.target.value}))} placeholder={lang==='fr'?'+243…':'+243…'} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">{t.photo}</label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePickPhoto} className="border rounded-lg px-3 py-2" />
              {newItem.photoUrl && <img src={newItem.photoUrl} className="w-full h-36 object-cover rounded"/>}
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button onClick={handleCreateListing} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">{t.create}</button>
            </div>
          </div>
        </section>

        {/* Admin (ALWAYS enabled) */}
        <section className="mb-8 border rounded-2xl p-4 bg-white">
          <h2 className="text-xl font-semibold mb-3">{t.admin}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">{t.commission}</label>
              <input type="number" className="border rounded-lg px-3 py-2 w-full" value={config.commissionPct} onChange={e=> setConfig(c=> ({...c, commissionPct: Number(e.target.value)||0}))} />
            </div>
            <div>
              <label className="text-sm">{t.currency}</label>
              <input className="border rounded-lg px-3 py-2 w-full" value={config.currency} onChange={e=> setConfig(c=> ({...c, currency: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm">{t.support}</label>
              <input className="border rounded-lg px-3 py-2 w-full" value={config.supportPhone||""} onChange={e=> setConfig(c=> ({...c, supportPhone: e.target.value}))} placeholder={lang==='fr'?'+243…':'+243…'} />
            </div>
          </div>

          <div className="mt-4">
            <div className="font-medium mb-2">{t.categories}</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(config.visibleCategories).map(slug => (
                <label key={slug} className="flex items-center gap-2 border rounded-full px-3 py-1">
                  <input type="checkbox" checked={config.visibleCategories[slug as CategorySlug]} onChange={e=> setConfig(c=> ({...c, visibleCategories: {...c.visibleCategories, [slug]: e.target.checked}}))} />
                  <span>{CAT_ICON[slug as CategorySlug]} {t.catLabel[slug as CategorySlug]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 text-right">
            <button onClick={()=> alert(lang==='fr'? 'Paramètres sauvegardés (local)':'Settings saved (local)')} className="px-4 py-2 rounded-xl border">{t.save}</button>
          </div>
        </section>

        {/* Category grid with icons */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{t.listingsByCategory}</h2>
          <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-3 mb-4">
            {visibleCats.map(slug => (
              <a key={slug} href={`#cat-${slug}`} className="border rounded-2xl p-4 bg-white hover:shadow flex items-center gap-3">
                <div className="text-3xl">{CAT_ICON[slug as CategorySlug]}</div>
                <div className="font-medium">{t.catLabel[slug as CategorySlug]}</div>
              </a>
            ))}
          </div>

          {/* Listings grouped by category */}
          <div className="space-y-8">
            {visibleCats.map(slug => (
              <div key={slug} id={`cat-${slug}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">{CAT_ICON[slug as CategorySlug]}</div>
                  <h3 className="text-lg font-semibold">{t.catLabel[slug as CategorySlug]}</h3>
                </div>
                {listingsByCat[slug as CategorySlug].length === 0 ? (
                  <div className="text-sm text-slate-500">{t.emptyCat}</div>
                ) : (
                  <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-3">
                    {listingsByCat[slug as CategorySlug].map(it => (
                      <ListingCard key={it.id} it={it} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 text-center text-slate-500">
        © {new Date().getFullYear()} Wapilocs — {lang==='fr'? 'Prototype propre v3':'Clean prototype v3'}
      </footer>
    </div>
  );
}
