import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const FIELDS = {
  name: "short nickname, e.g. street name + type ('Elm Park Gardens flat')",
  address: "street address as shown",
  area: "neighbourhood / village / town",
  asking_price: "number in GBP, no symbols",
  bedrooms: "integer",
  bathrooms: "integer",
  sq_ft: "integer internal floor area in sq ft (convert from sq m × 10.764 if only sq m given)",
  tenure: "Freehold | Leasehold | Share of freehold",
  service_charge: "number GBP per YEAR — if stated per month multiply by 12, per quarter by 4, per half-year by 2; if a range, use the higher figure",
  ground_rent: "number GBP per YEAR (convert as for service charge); 0 if stated as peppercorn/none",
  council_tax_band: "single letter",
  council_tax: "annual council tax amount in GBP if an actual £ figure is stated (convert monthly ×12); null if only the band is given",
  epc: "rating letter, e.g. C",
  outside_space: "short description (garden, terrace, balcony…)",
  parking: "short description",
  agent: "estate agent name",
  pros: "key features as a short bullet list, one per line starting '- '",
};

const FACT_WORDS =
  /(service charge|maintenance charge|management fee|estate charge|ground rent|council tax|tenure|leasehold|freehold|share of freehold|years? (?:remaining|left|unexpired)|lease length|EPC|energy (?:performance|rating)|sq\.? ?ft|square feet|sq\.? ?m\b|parking|garage|garden|terrace|balcony)/gi;

const FACT_KEYS =
  /"((?:annual)?(?:ServiceCharge|serviceCharge|service_charge|GroundRent|groundRent|ground_rent)|councilTax(?:Band)?|council_tax_band|tenureType|tenure|yearsRemainingOnLease|leaseLength|lengthOfLease|groundRentReviewPeriod(?:InYears)?|domesticRates|epc(?:Rating)?|currentEnergyRating|floorArea|displaySize|sizeInSqFt)"\s*:\s*("(?:[^"\\]|\\.){0,120}"|[-0-9.]+|true|false|null|\{[^{}]{0,300}\})/g;

// Details like service charge often sit deep in the page — pull them out wherever they are.
function keyFacts(html: string, text: string) {
  const facts = new Set<string>();
  for (const m of html.matchAll(FACT_KEYS)) facts.add(`${m[1]}: ${m[2]}`);
  for (const m of text.matchAll(FACT_WORDS)) {
    const i = m.index ?? 0;
    facts.add(text.slice(Math.max(0, i - 100), i + 180).trim());
    if (facts.size > 80) break;
  }
  return [...facts].join("\n");
}

// Pull the useful bits out of a listing page: key facts + structured data blobs + readable text.
function condense(html: string) {
  const parts: string[] = [];
  const grab = (re: RegExp) => {
    for (const m of html.matchAll(re)) if (m[1]) parts.push(m[1].trim());
  };
  grab(/<title[^>]*>([\s\S]*?)<\/title>/gi);
  grab(/<meta[^>]+(?:property|name)=["'](?:og:[^"']+|description)["'][^>]+content=["']([^"']+)["']/gi);
  grab(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  grab(/window\.PAGE_MODEL\s*=\s*(\{[\s\S]*?\})\s*<\/script>/gi); // Rightmove
  grab(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi); // Zoopla / OnTheMarket
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&pound;/g, "£")
    .replace(/\s+/g, " ");
  parts.push(text);
  const facts = keyFacts(html, text);
  return (`KEY FACTS FOUND ON PAGE (service charge, ground rent, tenure etc.):\n${facts || "(none found)"}\n\nFULL PAGE:\n` + parts.join("\n\n")).slice(0, 120000);
}

function parseJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: me } = await sb.rpc("my_name");
  if (!me) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in Vercel." }, { status: 500 });

  const { url, debug } = (await req.json()) as { url?: string; debug?: boolean };
  const diag: Record<string, unknown> = {};
  let target: URL;
  try {
    target = new URL(String(url ?? "").trim());
    if (!/^https?:$/.test(target.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Please paste a full web address starting with https://" }, { status: 400 });
  }

  const instructions = `Extract the property listing details and reply with ONLY a JSON object using these keys (use null when not stated — never guess). Check the KEY FACTS section carefully for service charge, ground rent, tenure and council tax — these are often only mentioned there or in a "material information" / "costs" section:
${Object.entries(FIELDS).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // 1) Try reading the page directly.
  let page: string | null = null;
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    diag.status = res.status;
    if (res.ok) {
      const html = await res.text();
      diag.htmlLength = html.length;
      diag.facts = keyFacts(html, html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).slice(0, 4000);
      if (html.length > 2000) page = condense(html);
    }
  } catch (e) {
    diag.fetchError = String(e);
    page = null;
  }

  let answer = "";
  try {
    if (page) {
      const r = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: `${instructions}\n\nListing URL: ${target}\n\nPage content:\n${page}` }],
      });
      answer = r.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      diag.firstPass = answer.slice(0, 2000);
    }
    // 2) If the site blocked us or nothing useful came back, let Claude fetch it.
    const parsed = answer ? parseJson(answer) : null;
    const leaseholdMissingCharge =
      parsed && /lease/i.test(String(parsed.tenure ?? "")) && (parsed.service_charge == null || parsed.service_charge === "");
    if (!parsed || !parsed.asking_price || leaseholdMissingCharge) {
      const r = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        tools: [{ type: "web_fetch_20250910", name: "web_fetch", max_uses: 2 }],
        messages: [{ role: "user", content: `Fetch ${target} and then:\n${instructions}` }],
      });
      const t = r.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
      diag.secondPass = t.slice(0, 2000);
      const second = parseJson(t);
      if (second) {
        // Merge: keep first-pass values, fill any gaps from the second pass
        const merged = { ...second, ...Object.fromEntries(Object.entries(parsed ?? {}).filter(([, v]) => v != null && v !== "")) };
        answer = JSON.stringify(merged);
      }
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Claude request failed" }, { status: 502 });
  }

  const data = parseJson(answer);
  if (!data) return NextResponse.json({ error: "Couldn't read that page. The site may block automated access — enter the details by hand." }, { status: 422 });

  // Keep only known keys, coerce numbers.
  const nums = ["asking_price", "bedrooms", "bathrooms", "sq_ft", "service_charge", "ground_rent", "council_tax"];
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(FIELDS)) {
    let v = data[k];
    if (v === "" || v === undefined) v = null;
    if (v != null && nums.includes(k)) {
      const n = Number(String(v).replace(/[^0-9.]/g, ""));
      v = Number.isFinite(n) && (n > 0 || k === "ground_rent") ? Math.round(n) : null;
    }
    if (v != null) out[k] = v;
  }
  return NextResponse.json(debug ? { fields: out, diag } : { fields: out });
}
