export type Task = {
  id: string;
  title: string;
  category: string;
  kind: "task" | "appointment";
  due_date: string | null;
  due_time: string | null;
  owner: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "normal" | "high";
  notes: string | null;
  created_by: string | null;
  updated_at: string;
};

export type Possession = {
  id: string;
  name: string;
  room: string;
  category: string;
  destination: "undecided" | "london" | "country" | "storage" | "sell" | "donate" | "dispose";
  status: "in_place" | "packed" | "in_storage" | "moved" | "gone";
  box_label: string | null;
  quantity: number;
  est_value: number | null;
  size: "small" | "medium" | "large" | "furniture" | null;
  fragile: boolean;
  notes: string | null;
  created_by: string | null;
  updated_at: string;
};

export type Property = {
  id: string;
  name: string;
  kind: "london" | "country";
  address: string | null;
  area: string | null;
  asking_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sq_ft: number | null;
  tenure: string | null;
  service_charge: number | null;
  ground_rent: number | null;
  council_tax_band: string | null;
  council_tax: number | null;
  epc: string | null;
  outside_space: string | null;
  parking: string | null;
  link: string | null;
  agent: string | null;
  status: "shortlist" | "viewing" | "second_viewing" | "offer" | "agreed" | "rejected";
  viewing_date: string | null;
  gareth_score: number | null;
  kristin_score: number | null;
  gareth_notes: string | null;
  kristin_notes: string | null;
  pros: string | null;
  cons: string | null;
  created_by: string | null;
  updated_at: string;
};

export type BudgetItem = {
  id: string;
  label: string;
  section: "Sale proceeds" | "London purchase" | "Country purchase" | "Moving costs" | "Storage" | "Other";
  direction: "in" | "out";
  estimate: number | null;
  actual: number | null;
  notes: string | null;
};

export type Contact = {
  id: string;
  name: string;
  company: string | null;
  role: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  author: string | null;
  thread: string;
  created_at: string;
};

export type Member = { email: string; name: string };
