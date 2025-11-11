import React, { useMemo, useState, useEffect, useRef } from "react";

// Wapilocs — Web Prototype (Preview) v2.2
// Nouveautés v2.2
// - Type de publication: Offre | Besoin (toggle en-tête + dans le formulaire)
// - Validation adaptée (paiement non requis pour Besoin)
// - Affichage des besoins: badge violet, actions limitées (Contact/Chat)
// - Séctions par catégorie: besoins en premier, puis offres
// - Bouton d’accès rapide “Publier un besoin” dans le header

// Category slugs (internal keys)
const CATEGORY_SLUGS = [
  "generators",
  "events",
  "tools",
  "transport",
  "services",
  "electronics",
  "heavy_btp",
  "moving",
];

const PAYMENTS = ["Airtel Money", "M-Pesa", "Orange Money", "Card"];

// ✅ Real images per category (local / public)
const CAT_IMAGES: Record<string, string> = {
  generators: "/cat/generators-512.webp",
  events: "/cat/cat_events.webp",
  tools: "/cat/cat_tools.webp",
  transport: "/cat/cat_transport.webp",
  services: "/cat/cat_services.webp",
  electronics: "/cat/cat_electronics_alt.webp",
  heavy_btp: "/cat/cat_heavy_btp.webp",
  moving: "/cat/cat_moving.webp",
};

// Default admin-config
const DEFAULT_CONFIG = {
  commission: 0.15,
  commissionVisibility: "owners", // 'none' | 'owners' | 'renters' | 'all'
  autoRefundHours: 24,
  paymentsEnabled: {
    "Airtel Money": true,
    "M-Pesa": true,
    "Orange Money": true,
    Card: true,
  },
  flags: {
    conciergeEnabled: true,
    chatOnlyBeforeBooking: true,
    markPaidCash: true,
    qrPin: true,
    escrowEnabled: true,
  },
  visibleCategories: {
    generators: true,
    events: true,
    tools: true,
    transport: true,
    services: true,
    electronics: true,
    heavy_btp: true,
    moving: true,
  },
  // Branding
  logoUrl: "/logo-wapilocs.png",
};

const I18N = {
  en: {
    appTitle: "Wapilocs",
    slogan: "Rent. Share. Earn.",
    titlePh: "Title (e.g., Generator for rent)",
    descPh: "Description",
    pricePh: "Price (optional)",
    phonePh: "Phone number",
    category: "Category",
    postType: "I am posting",
    offer: "Offer",
    need: "Need",
    publishOffer: "Post",
    publishNeed: "Publish need",
    payment: "Preferred Payment Mode",
    pickImage: "Image URL (optional)",
    uploadImage: "Choose an image — or take a photo",
    listings: "Listings",
    needsSection: "Recent needs",
    missing: "Please fill title, description and phone.",
    contact: "Contact",
    searchPh: "Search title or description…",
    all: "All",
    lang: "FR",
    tabFeed: "Feed",
    tabMap: "Map",
    chat: "Chat",
    send: "Send",
    nearMe: "Near me",
    preview: "Preview",
    feeSimHint: "Enter a price (e.g., 10000) to see commission & payout.",
    commissionLabel: "Commission (15%)",
    payoutLabel: "Payout (before processor fees)",
    ask: "Request via Wapilocs",
    propose: "Propose a solution",
    pending: "Pending",
    confirm: "Confirm",
    confirmed: "Confirmed",
    payNow: "Pay (simulate)",
    paidBlocked: "Paid (escrow)",
    showOtp: "Show OTP",
    validateOtp: "Validate OTP",
    delivered: "Delivered",
    completed: "Completed",
    report: "Report a problem",
    refunded: "Refunded",
    protection: "Payment secured (escrow)",
    refundIn: function (h: number) {
      return "Auto-refund in " + h + "h if no delivery";
    },
    phoneHint: "Ex: +243 97 000 0000 or 9–15 digits.",
    required: {
      title: "Title is required",
      desc: "Description is required",
      phone: "Phone is required (e.g., +243…)",
      payment: "Choose a payment mode",
    },
    invalid: {
      phone: "Invalid phone format (use +243 or local)",
    },
    needBadge: "NEED",
    offerBadge: "OFFER",
    catLabel: {
      generators: "Generators & Energy",
      events: "Event Equipment",
      tools: "Tools & Construction",
      transport: "Short-term Transport",
      services: "Local Services",
      electronics: "Electronics & Audio",
      heavy_btp: "Heavy Equipment (BTP)",
      moving: "Moving & Relocation",
    },
    dyn: {
      sectionMoving: "Moving details",
      forfait: "Package (e.g., 120,000 FC / 3h / 10km)",
      extraHour: "Extra per hour (FC)",
      extraKm: "Extra per km (FC)",
      floors: "Floors (no elevator)",
      elevator: "Elevator available",
      team: "Team size",
      area: "Service area / zone",
      options: "Options",
      optPacking: "Packing",
      optAssembly: "Furniture assembly",
      optCleaning: "Cleaning",
      deposit: "Deposit (optional)",
      sectionBtp: "Heavy equipment details",
      machineType: "Machine type (e.g., Loader 950GC)",
      tonnage: "Tonnage / capacity",
      bucket: "Bucket / attachment",
      withOperator: "With operator",
      mobilisation: "Mobilisation fee",
      minDays: "Minimum days",
      zone: "Zone",
      dailyRate: "Daily rate (FC)",
    },
  },
  fr: {
    appTitle: "Wapilocs",
    slogan: "Louez. Partagez. Gagnez.",
    titlePh: "Titre (ex.: Générateur à louer)",
    descPh: "Description",
    pricePh: "Prix (optionnel)",
    phonePh: "Numéro de téléphone",
    category: "Catégorie",
    postType: "Je publie",
    offer: "Offre",
    need: "Besoin",
    publishOffer: "Publier",
    publishNeed: "Publier un besoin",
    payment: "Mode de paiement préféré",
    pickImage: "URL de l'image (optionnel)",
    uploadImage: "Choisissez une image — ou prenez une photo",
    listings: "Annonces",
    needsSection: "Besoins récents",
    missing: "Veuillez remplir le titre, la description et le téléphone.",
    contact: "Contacter",
    searchPh: "Rechercher titre ou description…",
    all: "Toutes",
    lang: "EN",
    tabFeed: "Flux",
    tabMap: "Carte",
    chat: "Chat",
    send: "Envoyer",
    nearMe: "Autour de moi",
    preview: "Aperçu",
    feeSimHint: "Saisis un prix (ex: 10000) pour voir la commission et le payout.",
    commissionLabel: "Commission (15%)",
    payoutLabel: "Payout (avant frais du prestataire)",
    ask: "Demander via Wapilocs",
    propose: "Proposer une solution",
    pending: "En attente",
    confirm: "Confirmer",
    confirmed: "Confirmé",
    payNow: "Payer (simulation)",
    paidBlocked: "Payé (bloqué)",
    showOtp: "Voir OTP",
    validateOtp: "Valider OTP",
    delivered: "Livré",
    completed: "Terminé",
    report: "Signaler un problème",
    refunded: "Remboursé",
    protection: "Paiement sécurisé (escrow)",
    refundIn: function (h: number) {
      return "Remboursement auto dans " + h + "h si pas de livraison";
    },
    phoneHint: "+243 97 000 0000 ou 9–15 chiffres.",
    required: {
      title: "Le titre est requis",
      desc: "La description est requise",
      phone: "Le téléphone est requis (ex.: +243…)",
      payment: "Choisissez un mode de paiement",
    },
    invalid: {
      phone: "Format de téléphone invalide (utilisez +243 ou local)",
    },
    needBadge: "BESOIN",
    offerBadge: "OFFRE",
    catLabel: {
      generators: "Générateurs & Énergie",
      events: "Événementiel",
      tools: "Outils & Chantier",
      transport: "Transport court terme",
      services: "Services locaux",
      electronics: "Électronique & Audio",
      heavy_btp: "Engins & Matériels BTP",
      moving: "Déménagement",
    },
    dyn: {
      sectionMoving: "Détails déménagement",
      forfait: "Forfait (ex. 120 000 FC / 3h / 10km)",
      extraHour: "Heure sup. (FC)",
      extraKm: "Km sup. (FC)",
      floors: "Étages (sans ascenseur)",
      elevator: "Ascenseur disponible",
      team: "Équipe (nbre personnes)",
      area: "Zone desservie",
      options: "Options",
      optPacking: "Emballage",
      optAssembly: "Montage meubles",
      optCleaning: "Nettoyage",
      deposit: "Caution (optionnel)",
      sectionBtp: "Détails engin BTP",
      machineType: "Type d'engin (ex. Loader 950GC)",
      tonnage: "Tonnage / capacité",
      bucket: "Godet / accessoire",
      withOperator: "Avec opérateur",
      mobilisation: "Frais de mobilisation",
      minDays: "Jours minimum",
      zone: "Zone",
      dailyRate: "Tarif jour (FC)",
    },
  },
};

// Helper: parse a price string like "10,000 FC/jour" -> 10000 (number)
function parseCDF(str: any) {
  if (!str) return null;
  const digits = String(str).replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? null : n;
}

// Compute platform fee & owner payout (before payment-processing fees)
function breakdown(amount: number | null, rate: number) {
  if (amount == null || typeof rate !== "number") return null;
  const platform_fee = Math.round(amount * rate);
  const owner_payout = amount - platform_fee; // before processor fees
  return { platform_fee, owner_payout };
}

const Chip = ({
  label,
  selected,
  onClick,
  color = "border-slate-300",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full border ${
      selected ? "border-emerald-600 bg-emerald-50 font-semibold" : color
    } mr-2 mb-2 text-sm`}
  >
    {label}
  </button>
);

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-block text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200 mr-2 mb-2 ${className}`}>
    {children}
  </span>
);

// Bigger logo + fallback SVG
const Logo = ({ url }: { url?: string }) => {
  if (url)
    return (
      <img src={url} alt="Wapilocs logo" className="h-10 w-auto rounded" />
    );
  return (
    <svg viewBox="0 0 120 32" className="h-10 w-auto" aria-label="Wapilocs">
      <circle cx="16" cy="16" r="14" fill="#059669" />
      <text x="16" y="21" textAnchor="middle" fontSize="16" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto" fill="white">W</text>
      <text x="34" y="21" fontSize="16" fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto" fill="#0f172a">Wapilocs</text>
    </svg>
  );
};

const StatusPill = ({ status, t }: { status?: string; t: any }) => {
  if (!status || status === "available") return null;
  const map: any = {
    pending: { label: t.pending, cls: "bg-amber-50 border-amber-300 text-amber-700" },
    confirmed: { label: t.confirmed, cls: "bg-emerald-50 border-emerald-300 text-emerald-700" },
    paid_blocked: { label: t.paidBlocked, cls: "bg-sky-50 border-sky-300 text-sky-700" },
    delivered: { label: t.delivered, cls: "bg-indigo-50 border-indigo-300 text-indigo-700" },
    completed: { label: t.completed, cls: "bg-emerald-50 border-emerald-300 text-emerald-700" },
    refunded: { label: t.refunded, cls: "bg-rose-50 border-rose-300 text-rose-700" },
  };
  const s = map[status];
  return (
    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full border ${s.cls}`}>{s.label}</span>
  );
};

const ListingCard = ({
  item,
  t,
  onOpenChat,
  commissionRate,
  onAsk,
  onConfirm,
  onPay,
  onShowOtp,
  onValidateOtp,
  onReport,
  showCommission,
  autoRefundHours,
}: any) => {
  const amt = parseCDF(item.price);
  const bd = breakdown(amt, commissionRate);
  const isNeed = item.type === "need";
  return (
    <div className="border-b border-slate-200 py-4">
      <div className="text-lg font-semibold flex items-center flex-wrap gap-2">
        <span>{item.title}</span>
        {isNeed ? (
          <Badge className="bg-violet-50 border-violet-300 text-violet-700">{t.needBadge}</Badge>
        ) : (
          <Badge className="bg-emerald-50 border-emerald-300 text-emerald-700">{t.offerBadge}</Badge>
        )}
        <StatusPill status={item.status} t={t} />
      </div>
      <div className="text-xs opacity-70 mt-1">
        {t.catLabel[item.category] || item.category} | {item.payment || "-"}
      </div>
      {item.imageUrl && (
        <img src={item.imageUrl} alt="item" className="w-full h-48 object-cover rounded-xl mt-2" />
      )}
      <div className="mt-2">{item.description}</div>

      {item.status === "paid_blocked" && !isNeed && (
        <div className="mt-2 text-xs text-sky-700 flex items-center gap-2">
          <span className="px-2 py-1 rounded-full bg-sky-50 border border-sky-200">{t.protection}</span>
          <span className="opacity-70">• {t.refundIn(autoRefundHours)}</span>
        </div>
      )}

      {item.category === "moving" && item.moving && !isNeed && (
        <div className="mt-2 text-xs text-slate-700 flex flex-wrap">
          {item.moving.forfait && <Badge>{item.moving.forfait}</Badge>}
          {item.moving.extraHour && <Badge>+{item.moving.extraHour}/h</Badge>}
          {item.moving.extraKm && <Badge>+{item.moving.extraKm}/km</Badge>}
          {typeof item.moving.floors === "number" && (<Badge>{item.moving.floors} étages</Badge>)}
          {item.moving.elevator && <Badge>Ascenseur</Badge>}
          {item.moving.team && <Badge>{item.moving.team} pers.</Badge>}
          {item.moving.area && <Badge>{item.moving.area}</Badge>}
          {item.moving.options?.packing && <Badge>Emballage</Badge>}
          {item.moving.options?.assembly && <Badge>Montage</Badge>}
          {item.moving.options?.cleaning && <Badge>Nettoyage</Badge>}
          {item.moving.deposit && <Badge>Caution: {item.moving.deposit}</Badge>}
        </div>
      )}

      {item.category === "heavy_btp" && item.btp && !isNeed && (
        <div className="mt-2 text-xs text-slate-700 flex flex-wrap">
          {item.btp.machineType && <Badge>{item.btp.machineType}</Badge>}
          {item.btp.tonnage && <Badge>{item.btp.tonnage}</Badge>}
          {item.btp.bucket && <Badge>{item.btp.bucket}</Badge>}
          {item.btp.withOperator && <Badge>Avec opérateur</Badge>}
          {item.btp.mobilisation && (<Badge>Mobilisation: {item.btp.mobilisation}</Badge>)}
          {item.btp.minDays && <Badge>Min {item.btp.minDays} j</Badge>}
          {item.btp.zone && <Badge>{item.btp.zone}</Badge>}
          {item.btp.dailyRate && <Badge>{item.btp.dailyRate} / jour</Badge>}
          {item.btp.deposit && <Badge>Caution: {item.btp.deposit}</Badge>}
        </div>
      )}

      {item.price && showCommission && !isNeed && (
        <div className="mt-2">
          <div className="font-semibold">Price: {item.price}</div>
          {bd && (
            <div className="text-xs text-slate-600 mt-1">
              {t.commissionLabel}: <span className="font-semibold">{bd.platform_fee.toLocaleString()} FC</span> • {t.payoutLabel}: <span className="font-semibold">{bd.owner_payout.toLocaleString()} FC</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <a href={`tel:${item.phone}`} className="bg-emerald-600 text-white px-3 py-2 rounded-lg">{t.contact}: {item.phone}</a>
        <button onClick={() => onOpenChat(item)} className="bg-slate-800 text-white px-3 py-2 rounded-lg">{t.chat}</button>

        {/* Actions pour OFFRES uniquement */}
        {!isNeed && (!item.status || item.status === "available") && (
          <button onClick={() => onAsk(item)} className="bg-amber-600 text-white px-3 py-2 rounded-lg">{t.ask}</button>
        )}
        {!isNeed && item.status === "pending" && (
          <button onClick={() => onConfirm(item)} className="bg-emerald-700 text-white px-3 py-2 rounded-lg">{t.confirm}</button>
        )}
        {!isNeed && item.status === "confirmed" && (
          <button onClick={() => onPay(item)} className="bg-sky-700 text-white px-3 py-2 rounded-lg">{t.payNow}</button>
        )}
        {!isNeed && item.status === "paid_blocked" && (
          <>
            <button onClick={() => onShowOtp(item)} className="bg-indigo-700 text-white px-3 py-2 rounded-lg">{t.showOtp}</button>
            <button onClick={() => onValidateOtp(item)} className="bg-emerald-700 text-white px-3 py-2 rounded-lg">{t.validateOtp}</button>
            <button onClick={() => onReport(item)} className="bg-rose-600 text-white px-3 py-2 rounded-lg">{t.report}</button>
          </>
        )}

        {/* Action pour BESOINS: proposer une solution */}
        {isNeed && (
          <button onClick={() => alert("OK — solution proposée (démo)")} className="bg-violet-700 text-white px-3 py-2 rounded-lg">{t.propose}</button>
        )}
      </div>
    </div>
  );
};

// --- Simple phone validator (+ country code or local digits) ---
function isValidPhone(v: any) {
  if (!v) return false;
  const s = String(v).trim();
  return /^\+\d{9,15}$/.test(s) || /^\d{9,15}$/.test(s);
}

function genOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function App() {
  // Admin always enabled (button opens settings)
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chs_admin_config");
      if (saved) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
    } catch (e) {
      console.warn("Config load failed", e);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("chs_admin_config", JSON.stringify(config));
    } catch {}
  }, [config]);

  const [lang, setLang] = useState<"en" | "fr">("en");
  useEffect(() => {
    const saved = localStorage.getItem("chs_lang");
    if (saved === "en" || saved === "fr") {
      setLang(saved as any);
    } else {
      const browser = (navigator.language || "en").toLowerCase();
      if (browser.startsWith("fr")) setLang("fr");
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("chs_lang", lang);
  }, [lang]);

  const t = useMemo(() => I18N[lang], [lang]);
  const commissionRate = config.commission;
  const showCommissionForOwners =
    config.commissionVisibility === "owners" || config.commissionVisibility === "all";
  const showCommissionForRenters =
    config.commissionVisibility === "renters" || config.commissionVisibility === "all";
  const enabledPayments = useMemo(
    () => PAYMENTS.filter((p) => (config.paymentsEnabled as any)[p]),
    [config]
  );
  const visibleCats = useMemo(
    () => CATEGORY_SLUGS.filter((slug) => (config.visibleCategories as any)[slug]),
    [config]
  );
  const [tab, setTab] = useState<"feed" | "map">("feed");

  // === NEW: post type (offer | need)
  const [postType, setPostType] = useState<"offer" | "need">("offer");

  // form (includes live fee simulation for the entered price)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFilePreview, setImageFilePreview] = useState("");
  const [category, setCategory] = useState(visibleCats[0] || CATEGORY_SLUGS[0]);
  const [payment, setPayment] = useState(enabledPayments[0] || PAYMENTS[0]);
  // dynamic fields state
  const [moving, setMoving] = useState<any>({
    forfait: "",
    extraHour: "",
    extraKm: "",
    floors: 0,
    elevator: false,
    team: 2,
    area: "",
    options: { packing: false, assembly: false, cleaning: false },
    deposit: "",
  });
  const [btp, setBtp] = useState<any>({
    machineType: "",
    tonnage: "",
    bucket: "",
    withOperator: true,
    mobilisation: "",
    minDays: 1,
    zone: "",
    dailyRate: "",
    deposit: "",
  });

  // validation state + refs
  const [errors, setErrors] = useState<any>({});
  const titleRef = useRef<HTMLDivElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!(config.paymentsEnabled as any)[payment]) {
      setPayment(enabledPayments[0] || PAYMENTS[0]);
    }
  }, [config, enabledPayments, payment]);
  useEffect(() => {
    if (!(config.visibleCategories as any)[category]) {
      setCategory(visibleCats[0] || CATEGORY_SLUGS[0]);
    }
  }, [config, visibleCats, category]);

  // --- Persistence: listings + chatMap ---
  const LS_LISTINGS_KEY = "chs_listings_v22";
  const LS_CHATMAP_KEY = "chs_chatmap_v22";

  const DEFAULT_LIST = [
    {
      id: "1",
      type: "offer",
      title: "Generator 8kVA for rent",
      description: "Reliable diesel generator, daily hire.",
      price: "10,000 FC/day",
      phone: "+243970000001",
      imageUrl:
        "https://images.unsplash.com/photo-1581091012167-5b2b86b59744?q=80&w=1200&auto=format&fit=crop",
      category: "generators",
      payment: "Airtel Money",
      status: "available",
    },
    {
      id: "2",
      type: "offer",
      title: "Motorbike for short hire",
      description: "Perfect for errands around town.",
      price: "25,000 FC/day",
      phone: "+243970000002",
      imageUrl:
        "https://images.unsplash.com/photo-1518655048521-f130df041f66?q=80&w=1200&auto=format&fit=crop",
      category: "transport",
      payment: "M-Pesa",
      status: "available",
    },
    {
      id: "3",
      type: "offer",
      title: "Loader CAT 950GC (with operator)",
      description:
        "18t loader, 3.1 m³ bucket. Operator included. Mobilisation extra.",
      price: "450,000 FC/day",
      phone: "+243970000003",
      imageUrl:
        "https://images.unsplash.com/photo-1581092795360-fd1f78d244a1?q=80&w=1200&auto=format&fit=crop",
      category: "heavy_btp",
      payment: "Airtel Money",
      status: "available",
      btp: {
        machineType: "Loader 950GC",
        tonnage: "18t",
        bucket: "3.1 m³",
        withOperator: true,
        mobilisation: "100,000 FC",
        minDays: 1,
        zone: "Lubumbashi",
        dailyRate: "450,000 FC",
        deposit: "",
      },
    },
    {
      id: "4",
      type: "offer",
      title: "Déménagement — 2 hommes + pickup",
      description:
        "Chargement, transport, déchargement. Lubumbashi et communes voisines.",
      price: "120,000 FC/jour",
      phone: "+243970000004",
      imageUrl:
        "https://images.unsplash.com/photo-1598300183870-1db9f2021f5c?q=80&w=1200&auto=format&fit=crop",
      category: "moving",
      payment: "Orange Money",
      status: "available",
      moving: {
        forfait: "120,000 FC / 3h / 10km",
        extraHour: "20,000 FC",
        extraKm: "2,000 FC",
        floors: 1,
        elevator: false,
        team: 2,
        area: "Lushi centre",
        options: { packing: true, assembly: false, cleaning: false },
        deposit: "",
      },
    },
    // Exemple de besoin
    {
      id: "5",
      type: "need",
      title: "Besoin d'un peintre demain matin",
      description: "Salon 30 m², Kolwezi centre. Matériel disponible.",
      price: "",
      phone: "+243970000005",
      imageUrl: "",
      category: "services",
      payment: "",
      status: "available",
    },
  ];

  const [listings, setListings] = useState<any[]>(DEFAULT_LIST);
  const [chatMap, setChatMap] = useState<any>({});

  // Load from localStorage at boot
  useEffect(() => {
    try {
      const lsv = localStorage.getItem(LS_LISTINGS_KEY);
      if (lsv) setListings(JSON.parse(lsv));
      const cm = localStorage.getItem(LS_CHATMAP_KEY);
      if (cm) setChatMap(JSON.parse(cm));
    } catch (e) {
      console.warn("load ls failed", e);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_LISTINGS_KEY, JSON.stringify(listings));
    } catch {}
  }, [listings]);
  useEffect(() => {
    try {
      localStorage.setItem(LS_CHATMAP_KEY, JSON.stringify(chatMap));
    } catch {}
  }, [chatMap]);

  const [search, setSearch] = useState("");

  // chat & admin
  const [chatOpen, setChatOpen] = useState(false);
  const [chatListing, setChatListing] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const chatMessages = chatListing ? chatMap[chatListing.id] || [] : [];
  const [adminOpen, setAdminOpen] = useState(false);

  // Filter by search, then group by category & type
  const filteredBySearch = useMemo(() => {
    const term = (search || "").toLowerCase();
    return listings.filter((it) => {
      const byTerm =
        !term ||
        String(it.title || "").toLowerCase().includes(term) ||
        String(it.description || "").toLowerCase().includes(term);
      const catOk = (config.visibleCategories as any)[it.category];
      return byTerm && catOk;
    });
  }, [listings, search, config.visibleCategories]);

  const groupedByCategory = useMemo(() => {
    const map: Record<string, { needs: any[]; offers: any[] }> = {} as any;
    for (const slug of CATEGORY_SLUGS) map[slug] = { needs: [], offers: [] };
    for (const it of filteredBySearch) {
      if ((config.visibleCategories as any)[it.category]) {
        if (it.type === "need") map[it.category].needs.push(it);
        else map[it.category].offers.push(it);
      }
    }
    return map;
  }, [filteredBySearch, config.visibleCategories]);

  function validate() {
    const errs: any = {};
    if (!title.trim()) errs.title = t.required.title;
    if (!description.trim()) errs.desc = t.required.desc;
    if (!phone.trim()) errs.phone = t.required.phone;
    else if (!isValidPhone(phone)) errs.phone = t.invalid.phone;
    if (postType === "offer" && !payment) errs.payment = t.required.payment;
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs.title && titleRef.current) {
        (titleRef.current as any).scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errs.phone && phoneRef.current) {
        (phoneRef.current as any).scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setPrice("");
    setPhone("");
    setImageUrl("");
    setImageFilePreview("");
    setErrors({});
    setCategory(visibleCats[0] || CATEGORY_SLUGS[0]);
    setPayment(enabledPayments[0] || PAYMENTS[0]);
    setMoving({
      forfait: "",
      extraHour: "",
      extraKm: "",
      floors: 0,
      elevator: false,
      team: 2,
      area: "",
      options: { packing: false, assembly: false, cleaning: false },
      deposit: "",
    });
    setBtp({
      machineType: "",
      tonnage: "",
      bucket: "",
      withOperator: true,
      mobilisation: "",
      minDays: 1,
      zone: "",
      dailyRate: "",
      deposit: "",
    });
  }

  function postListing() {
    if (!validate()) return;
    const chosenImage = imageFilePreview || (imageUrl.trim() || "");
    const payload: any = {
      id: String(Date.now()),
      type: postType, // NEW
      title: title.trim(),
      description: description.trim(),
      price: postType === "offer" ? (price.trim() || null) : "",
      phone: phone.trim(),
      imageUrl: chosenImage,
      category,
      payment: postType === "offer" ? payment : "",
      status: "available",
    };
    if (postType === "offer" && category === "moving") payload.moving = { ...moving };
    if (postType === "offer" && category === "heavy_btp") payload.btp = { ...btp };
    setListings([payload, ...listings]);
    resetForm();
  }

  // --- Booking actions (mock) ---
  function askBooking(item: any) {
    setListings(listings.map((x) => (x.id === item.id ? { ...x, status: "pending" } : x)));
  }
  function confirmBooking(item: any) {
    setListings(listings.map((x) => (x.id === item.id ? { ...x, status: "confirmed" } : x)));
  }
  function payBooking(item: any) {
    const otp = genOTP();
    const paidAt = Date.now();
    setListings(
      listings.map((x) =>
        x.id === item.id ? { ...x, status: "paid_blocked", otp, paidAt } : x
      )
    );
  }
  function showOtp(item: any) {
    if (item.otp) {
      alert((lang === "fr" ? "Code OTP de remise: " : "Delivery OTP: ") + item.otp);
    }
  }
  function validateOtp(item: any) {
    const code = prompt(lang === "fr" ? "Entrer OTP reçu du client" : "Enter client OTP");
    if (!code) return;
    if (String(code).trim() === String(item.otp)) {
      setListings(listings.map((x) => (x.id === item.id ? { ...x, status: "delivered" } : x)));
      setTimeout(() => {
        setListings((cur) => cur.map((x) => (x.id === item.id ? { ...x, status: "completed" } : x)));
      }, 600);
    } else {
      alert(lang === "fr" ? "OTP invalide" : "Invalid OTP");
    }
  }
  function reportProblem(item: any) {
    setListings(listings.map((x) => (x.id === item.id ? { ...x, status: "refunded" } : x)));
  }

  // Auto-refund timer effect
  useEffect(() => {
    const id = setInterval(() => {
      setListings((cur) =>
        cur.map((it: any) => {
          if (it.status === "paid_blocked" && config.autoRefundHours > 0 && it.paidAt) {
            const ms = config.autoRefundHours * 3600 * 1000;
            if (Date.now() - it.paidAt > ms) {
              return { ...it, status: "refunded" };
            }
          }
          return it;
        })
      );
    }, 10000);
    return () => clearInterval(id);
  }, [config.autoRefundHours]);

  // open chat loads per-listing messages from chatMap
  function openChat(it: any) {
    setChatListing(it);
    setChatOpen(true);
    if (!chatMap[it.id]) {
      setChatMap({
        ...chatMap,
        [it.id]: [
          { id: "m1", sender: "owner", text: lang === "fr" ? "Bonjour ! Disponible." : "Hi! Item is available." },
        ],
      });
    }
  }

  function sendChat() {
    if (!chatInput.trim() || !chatListing) return;
    const id = String(Date.now());
    const msgs = [...(chatMap[chatListing.id] || []), { id, sender: "me", text: chatInput.trim() }];
    setChatMap({ ...chatMap, [chatListing.id]: msgs });
    setChatInput("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo url={config.logoUrl} />
          <div>
            <h1 className="text-2xl font-bold">
              {t.appTitle} <span className="ml-2 text-xs font-normal px-2 py-1 border rounded-full">v2.2</span>
            </h1>
            <div className="text-sm text-slate-600">{t.slogan}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? ("fr" as any) : ("en" as any))}
            className="px-3 py-1 rounded-lg border border-slate-300 font-semibold"
          >
            {t.lang}
          </button>
          {/* Admin */}
          <button onClick={() => setAdminOpen(true)} className="px-3 py-1 rounded-lg border border-amber-500 text-amber-700">
            Admin
          </button>
          {/* NEW: Quick CTA */}
          <button
            onClick={() => {
              setPostType("need");
              setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
            }}
            className="px-3 py-1 rounded-lg bg-violet-600 text-white"
          >
            {t.publishNeed}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 mb-2">
        {["feed", "map"].map((key) => (
          <Chip key={key} label={key === "feed" ? t.tabFeed : t.tabMap} selected={tab === (key as any)} onClick={() => setTab(key as any)} />
        ))}
      </div>

      {tab === "feed" && (
        <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <div ref={formRef as any} className="p-4 border rounded-2xl shadow-sm bg-white">
              {/* NEW: Post type toggle */}
              <div className="mb-3">
                <div className="text-sm font-semibold mb-1">{t.postType}</div>
                <div className="flex flex-wrap">
                  {(["offer", "need"] as const).map((pt) => (
                    <Chip key={pt} label={pt === "offer" ? t.offer : t.need} selected={postType === pt} onClick={() => setPostType(pt)} color={pt === "need" ? "border-violet-500" : "border-emerald-500"} />
                  ))}
                </div>
              </div>

              <input ref={titleRef as any} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePh} className={`w-full border rounded-lg px-3 py-2 mb-1 ${errors.title ? "border-red-500" : "border-slate-300"}`} />
              {errors.title && <div className="text-xs text-red-600 mb-2">{errors.title}</div>}
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.descPh} className={`w-full border rounded-lg px-3 py-2 mb-1 h-24 ${errors.desc ? "border-red-500" : "border-slate-300"}`} />
              {errors.desc && <div className="text-xs text-red-600 mb-2">{errors.desc}</div>}

              <div className="grid grid-cols-2 gap-2">
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.pricePh + (postType === "need" ? " (facultatif)" : "")} className="border border-slate-300 rounded-lg px-3 py-2" disabled={postType === "need"} />
                <input ref={phoneRef as any} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePh} className={`border rounded-lg px-3 py-2 ${errors.phone ? "border-red-500" : "border-slate-300"}`} inputMode="tel" />
              </div>
              {!errors.phone && phone && (<div className="text-xs text-slate-500 mt-1">{t.phoneHint}</div>)}

              {/* Live fee simulation (owners/admin only) */}
              {postType === "offer" && showCommissionForOwners && (
                <div className="text-xs text-slate-600 mt-2">
                  {(() => {
                    const liveAmt = parseCDF(price);
                    if (!liveAmt) return <span>{t.feeSimHint}</span>;
                    const fee = Math.round(liveAmt * commissionRate);
                    const payout = liveAmt - fee;
                    return (<>
                      {t.commissionLabel}: <span className="font-semibold">{fee.toLocaleString()} FC</span> • {t.payoutLabel}: <span className="font-semibold">{payout.toLocaleString()} FC</span>
                    </>);
                  })()}
                </div>
              )}

              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t.pickImage} className="w-full border border-slate-300 rounded-lg px-3 py-2 my-2" />
              <div className="text-xs text-slate-500 mb-2">{t.uploadImage}</div>
              <input type="file" accept="image/*" capture="environment" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = (ev) => setImageFilePreview(String(ev.target?.result || ""));
                r.readAsDataURL(f);
              }} className="w-full mb-2" />
              {(imageFilePreview || imageUrl) && (
                <div className="mt-2">
                  <div className="text-xs font-semibold mb-1">{t.preview}</div>
                  <img src={imageFilePreview || imageUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border" />
                </div>
              )}

              <div>
                <div className="text-sm font-semibold mb-1">{t.category}</div>
                <div className="flex flex-wrap">
                  {visibleCats.map((slug) => (
                    <Chip key={slug} label={t.catLabel[slug]} selected={category === slug} onClick={() => { setCategory(slug); }} />
                  ))}
                </div>
              </div>

              {/* Dynamic fields per category */}
              {postType === "offer" && (
                <DynFields t={t} category={category} moving={moving} setMoving={setMoving} btp={btp} setBtp={setBtp} />
              )}

              {postType === "offer" && (
                <div className="mt-2">
                  <div className="text-sm font-semibold mb-1">{t.payment}</div>
                  <div className="flex flex-wrap">
                    {enabledPayments.map((mode) => (
                      <Chip key={mode} label={mode} selected={payment === mode} onClick={() => setPayment(mode)} color="border-emerald-500" />
                    ))}
                  </div>
                  {errors.payment && (<div className="text-xs text-red-600 mt-1">{errors.payment}</div>)}
                </div>
              )}

              <button onClick={postListing} className={`w-full mt-3 text-white py-2 rounded-lg ${postType === "need" ? "bg-violet-600" : "bg-emerald-600"}`}>
                {postType === "need" ? t.publishNeed : t.publishOffer}
              </button>
            </div>
          </div>

          {/* Feed: Search + Category Thumbs Grid + Sections */}
          <div className="lg:col-span-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchPh} className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3" />

            {/* ✅ Category Photo Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {visibleCats.map((slug) => (
                <a key={slug} href={`#cat-${slug}`} className="group border rounded-2xl p-4 bg-white hover:shadow transition flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-emerald-500 shrink-0">
                    <img src={CAT_IMAGES[slug]} alt={t.catLabel[slug]} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://picsum.photos/seed/fallback-"+slug+"/512/512"; }} />
                  </div>
                  <div className="font-medium">
                    {t.catLabel[slug]}
                    <div className="text-xs text-slate-500 group-hover:text-slate-700">{lang === "fr" ? "Voir les annonces" : "Browse listings"}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Sections per category (needs first) */}
            <div className="text-lg font-semibold mb-2">{t.listings}</div>
            <div className="space-y-8">
              {visibleCats.map((slug) => {
                const group = groupedByCategory[slug] || { needs: [], offers: [] };
                return (
                  <section key={slug} id={`cat-${slug}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-emerald-500">
                        <img src={CAT_IMAGES[slug]} alt={t.catLabel[slug]} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <h3 className="text-lg font-semibold">{t.catLabel[slug]}</h3>
                    </div>

                    {/* Needs */}
                    {group.needs.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-violet-700 mb-1">{t.needsSection}</div>
                        <div className="divide-y bg-white border rounded-2xl">
                          {group.needs.map((item: any) => (
                            <div key={item.id} className="px-4">
                              <ListingCard item={item} t={t} onOpenChat={openChat} commissionRate={commissionRate} onAsk={askBooking} onConfirm={confirmBooking} onPay={payBooking} onShowOtp={showOtp} onValidateOtp={validateOtp} onReport={reportProblem} showCommission={showCommissionForRenters} autoRefundHours={config.autoRefundHours} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Offers */}
                    {group.offers.length === 0 ? (
                      <div className="text-slate-500 border rounded-xl p-4 bg-white">
                        {lang === "fr" ? "Aucune offre dans cette catégorie." : "No offers in this category."}
                      </div>
                    ) : (
                      <div className="divide-y bg-white border rounded-2xl">
                        {group.offers.map((item: any) => (
                          <div key={item.id} className="px-4">
                            <ListingCard item={item} t={t} onOpenChat={openChat} commissionRate={commissionRate} onAsk={askBooking} onConfirm={confirmBooking} onPay={payBooking} onShowOtp={showOtp} onValidateOtp={validateOtp} onReport={reportProblem} showCommission={showCommissionForRenters} autoRefundHours={config.autoRefundHours} />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "map" && (
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-lg font-semibold mb-3">{t.nearMe}</div>
          <div className="w-full h-96 rounded-2xl border border-slate-200 grid place-items-center text-slate-500 bg-white">
            (Map preview placeholder) — Your location + listings would appear here.
          </div>
        </div>
      )}

      {/* Chat modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-40">
          <div className="bg-white w-full max-w-xl rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{t.chat} — {chatListing?.title || ""}</div>
              <button onClick={() => setChatOpen(false)} className="px-3 py-1 rounded-lg border border-slate-300">✕</button>
            </div>
            <div className="h-64 overflow-auto border border-slate-200 rounded-xl p-2 mb-2">
              {chatMessages.map((m: any) => (
                <div key={m.id} className={`my-1 flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-3 py-2 rounded-xl ${m.sender === "me" ? "bg-emerald-50" : "bg-slate-100"}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={lang === "fr" ? "Écrire…" : "Type…"} className="flex-1 border border-slate-300 rounded-lg px-3 py-2" />
              <button onClick={sendChat} className="px-4 bg-emerald-600 text-white rounded-lg">{t.send}</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {adminOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{t.lang === "fr" ? "Paramètres Admin" : "Admin Settings"}</div>
              <button onClick={() => setAdminOpen(false)} className="px-3 py-1 rounded-lg border">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Commission */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Commission (%)</div>
                <input type="number" min={0} max={50} value={Math.round(commissionRate * 100)} onChange={(e) => setConfig({ ...config, commission: Math.max(0, Math.min(0.5, Number(e.target.value) / 100)) })} className="w-32 border rounded px-2 py-1" />
                <div className="text-xs text-slate-500 mt-1">Actuel: {(commissionRate * 100).toFixed(1)}%</div>
              </div>

              {/* Commission visibility */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Affichage de la commission</div>
                {[
                  { key: "none", label: "Aucun" },
                  { key: "owners", label: "Propriétaires uniquement" },
                  { key: "renters", label: "Locataires uniquement" },
                  { key: "all", label: "Tous (propriétaires et locataires)" },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm mb-1">
                    <input type="radio" name="commvis" checked={config.commissionVisibility === (opt.key as any)} onChange={() => setConfig({ ...config, commissionVisibility: opt.key as any })} />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Payment rails */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Paiements activés</div>
                {PAYMENTS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm mb-1">
                    <input type="checkbox" checked={!!(config.paymentsEnabled as any)[p]} onChange={(e) => setConfig({ ...config, paymentsEnabled: { ...(config.paymentsEnabled as any), [p]: e.target.checked } })} />
                    {p}
                  </label>
                ))}
              </div>

              {/* Feature flags */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Fonctionnalités</div>
                {Object.entries(config.flags).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm mb-1">
                    <input type="checkbox" checked={!!v} onChange={(e) => setConfig({ ...config, flags: { ...config.flags, [k]: e.target.checked } })} />
                    {k}
                  </label>
                ))}
              </div>

              {/* Escrow settings */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Escrow & Sécurité</div>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" checked={!!config.flags.escrowEnabled} onChange={(e) => setConfig({ ...config, flags: { ...config.flags, escrowEnabled: e.target.checked } })} />
                  Escrow activé (argent bloqué jusqu’à OTP)
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span>Auto-remboursement (heures):</span>
                  <input type="number" min={0} max={168} value={config.autoRefundHours} onChange={(e) => setConfig({ ...config, autoRefundHours: Math.max(0, Math.min(168, Number(e.target.value) || 0)) })} className="w-24 border rounded px-2 py-1" />
                </div>
                <div className="text-xs text-slate-500 mt-1">0 = pas d’auto-remboursement</div>
              </div>

              {/* Categories */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Catégories visibles</div>
                {CATEGORY_SLUGS.map((slug) => (
                  <label key={slug} className="flex items-center gap-2 text-sm mb-1">
                    <input type="checkbox" checked={!!(config.visibleCategories as any)[slug]} onChange={(e) => setConfig({ ...config, visibleCategories: { ...(config.visibleCategories as any), [slug]: e.target.checked } })} />
                    <span className="inline-block w-5 h-5 rounded-full overflow-hidden ring mr-2 align-middle">
                      <img src={CAT_IMAGES[slug]} alt="" className="w-full h-full object-cover" />
                    </span>
                    {t.catLabel[slug]}
                  </label>
                ))}
              </div>

              {/* Branding */}
              <div className="border rounded-xl p-3">
                <div className="font-semibold mb-2">Logo</div>
                <input value={config.logoUrl} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })} placeholder="URL du logo (PNG/SVG)" className="w-full border rounded px-3 py-2 mb-2" />
                <div className="text-xs text-slate-500 mb-2">Colle un lien d'image (ex. https://.../logo.png). Laisse vide pour utiliser le logo par défaut.</div>
                <div className="h-12 flex items-center gap-3 border rounded px-3">
                  <span className="text-xs text-slate-500">Aperçu:</span>
                  <Logo url={config.logoUrl} />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setConfig(DEFAULT_CONFIG)} className="px-3 py-2 border rounded-lg">Réinitialiser</button>
              <button onClick={() => { localStorage.setItem("chs_admin_config", JSON.stringify(config)); setAdminOpen(false); }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DynFields({ t, category, moving, setMoving, btp, setBtp }: { t: any; category: string; moving: any; setMoving: any; btp: any; setBtp: any; }) {
  const d = t.dyn;
  if (category === "moving") {
    return (
      <div className="mt-3 border rounded-xl p-3">
        <div className="font-semibold mb-2">{d.sectionMoving}</div>
        <input value={moving.forfait} onChange={(e) => setMoving({ ...moving, forfait: e.target.value })} placeholder={d.forfait} className="w-full border rounded px-3 py-2 mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <input value={moving.extraHour} onChange={(e) => setMoving({ ...moving, extraHour: e.target.value })} placeholder={d.extraHour} className="border rounded px-3 py-2" />
          <input value={moving.extraKm} onChange={(e) => setMoving({ ...moving, extraKm: e.target.value })} placeholder={d.extraKm} className="border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input type="number" min={0} value={moving.floors} onChange={(e) => setMoving({ ...moving, floors: Number(e.target.value) })} placeholder={d.floors} className="border rounded px-3 py-2" />
          <input type="number" min={1} value={moving.team} onChange={(e) => setMoving({ ...moving, team: Number(e.target.value) })} placeholder={d.team} className="border rounded px-3 py-2" />
        </div>
        <div className="mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={moving.elevator} onChange={(e) => setMoving({ ...moving, elevator: e.target.checked })} /> {d.elevator}
          </label>
        </div>
        <input value={moving.area} onChange={(e) => setMoving({ ...moving, area: e.target.value })} placeholder={d.area} className="w-full border rounded px-3 py-2 mt-2" />
        <div className="mt-2 text-sm">
          <div className="font-semibold mb-1">{d.options}</div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={moving.options.packing} onChange={(e) => setMoving({ ...moving, options: { ...moving.options, packing: e.target.checked } })} /> {d.optPacking}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={moving.options.assembly} onChange={(e) => setMoving({ ...moving, options: { ...moving.options, assembly: e.target.checked } })} /> {d.optAssembly}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={moving.options.cleaning} onChange={(e) => setMoving({ ...moving, options: { ...moving.options, cleaning: e.target.checked } })} /> {d.optCleaning}</label>
          </div>
        </div>
        <input value={moving.deposit} onChange={(e) => setMoving({ ...moving, deposit: e.target.value })} placeholder={d.deposit} className="w-full border rounded px-3 py-2 mt-2" />
      </div>
    );
  }
  if (category === "heavy_btp") {
    return (
      <div className="mt-3 border rounded-xl p-3">
        <div className="font-semibold mb-2">{d.sectionBtp}</div>
        <input value={btp.machineType} onChange={(e) => setBtp({ ...btp, machineType: e.target.value })} placeholder={d.machineType} className="w-full border rounded px-3 py-2 mb-2" />
        <div className="grid grid-cols-2 gap-2">
          <input value={btp.tonnage} onChange={(e) => setBtp({ ...btp, tonnage: e.target.value })} placeholder={d.tonnage} className="border rounded px-3 py-2" />
          <input value={btp.bucket} onChange={(e) => setBtp({ ...btp, bucket: e.target.value })} placeholder={d.bucket} className="border rounded px-3 py-2" />
        </div>
        <div className="mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={btp.withOperator} onChange={(e) => setBtp({ ...btp, withOperator: e.target.checked })} /> {d.withOperator}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input value={btp.mobilisation} onChange={(e) => setBtp({ ...btp, mobilisation: e.target.value })} placeholder={d.mobilisation} className="border rounded px-3 py-2" />
          <input type="number" min={1} value={btp.minDays} onChange={(e) => setBtp({ ...btp, minDays: Number(e.target.value) })} placeholder={d.minDays} className="border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input value={btp.zone} onChange={(e) => setBtp({ ...btp, zone: e.target.value })} placeholder={d.zone} className="border rounded px-3 py-2" />
          <input value={btp.dailyRate} onChange={(e) => setBtp({ ...btp, dailyRate: e.target.value })} placeholder={d.dailyRate} className="border rounded px-3 py-2" />
        </div>
        <input value={btp.deposit} onChange={(e) => setBtp({ ...btp, deposit: e.target.value })} placeholder={t.dyn.deposit} className="w-full border rounded px-3 py-2 mt-2" />
      </div>
    );
  }
  return null;
}

// --- Dev Checks ---
console.assert(Object.keys(I18N.en.catLabel).length === 8 && Object.keys(I18N.fr.catLabel).length === 8, "Both languages must define 8 category labels");
console.assert(Array.isArray(PAYMENTS) && PAYMENTS.length >= 4, "PAYMENTS should contain at least 4 modes");
console.assert(typeof DEFAULT_CONFIG.commission === "number" && DEFAULT_CONFIG.commission >= 0 && DEFAULT_CONFIG.commission <= 0.5, "Commission default must be between 0% and 50%");
console.assert(["none", "owners", "renters", "all"].includes(DEFAULT_CONFIG.commissionVisibility as any), "commissionVisibility must be one of none/owners/renters/all");
console.assert(parseCDF("10,000 FC/jour") === 10000, "Price parser should extract 10000 from '10,000 FC/jour'");
