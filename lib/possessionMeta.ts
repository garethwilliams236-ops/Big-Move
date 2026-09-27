export const DESTINATIONS: Record<string, { label: string; cls: string }> = {
  undecided: { label: "Undecided", cls: "bg-black/5 text-muted" },
  london: { label: "London flat", cls: "bg-sky-100 text-sky-800" },
  country: { label: "Country house", cls: "bg-emerald-100 text-emerald-800" },
  storage: { label: "Storage", cls: "bg-amber-100 text-amber-800" },
  sell: { label: "Sell", cls: "bg-violet-100 text-violet-800" },
  donate: { label: "Donate", cls: "bg-rose-100 text-rose-800" },
  dispose: { label: "Dispose", cls: "bg-stone-200 text-stone-700" },
};

export const P_STATUS: Record<string, string> = {
  in_place: "Not packed",
  packed: "Packed",
  in_storage: "In storage",
  moved: "Moved",
  gone: "Sold / gone",
};

export const ROOMS = [
  "Kitchen", "Living room", "Dining room", "Study", "Main bedroom", "Bedroom 2", "Bedroom 3", "Bedroom 4",
  "Bathrooms", "Hall & stairs", "Utility", "Loft", "Basement", "Garage", "Garden", "Other",
];

export const P_CATEGORIES = ["Furniture", "Art & pictures", "Books", "Clothes", "Kitchenware", "Electronics", "Linen", "Sports & outdoor", "Toys & kids", "Papers & documents", "Sentimental", "Garden", "General"];
