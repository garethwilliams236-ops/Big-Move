import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

async function buildContext(sb: Awaited<ReturnType<typeof supabaseServer>>) {
  const [tasks, items, props, budget] = await Promise.all([
    sb.from("tasks").select("title,category,due_date,owner,status").neq("status", "done").order("due_date").limit(60),
    sb.from("possessions").select("name,room,destination,status,quantity").limit(300),
    sb.from("properties").select("name,kind,area,asking_price,bedrooms,sq_ft,status,gareth_score,kristin_score,pros,cons").neq("status", "rejected"),
    sb.from("budget_items").select("label,section,direction,estimate,actual"),
  ]);
  const lines: string[] = [];
  lines.push(`Open tasks (${tasks.data?.length ?? 0}):`);
  for (const t of tasks.data ?? []) lines.push(`- ${t.due_date ?? "no date"} | ${t.title} [${t.category}, ${t.owner}, ${t.status}]`);
  const dest: Record<string, number> = {};
  for (const p of items.data ?? []) dest[p.destination] = (dest[p.destination] ?? 0) + (p.quantity ?? 1);
  lines.push(`\nPossessions: ${items.data?.length ?? 0} items. By destination: ${JSON.stringify(dest)}`);
  for (const p of (items.data ?? []).slice(0, 150)) lines.push(`- ${p.name} (${p.room}) → ${p.destination}, ${p.status}`);
  lines.push(`\nProperties being considered:`);
  for (const p of props.data ?? [])
    lines.push(`- ${p.name} [${p.kind}] ${p.area ?? ""} £${p.asking_price ?? "?"} ${p.bedrooms ?? "?"}bed ${p.sq_ft ?? "?"}sqft, ${p.status}, scores G${p.gareth_score ?? "-"} K${p.kristin_score ?? "-"}. Pros: ${p.pros ?? "-"} Cons: ${p.cons ?? "-"}`);
  lines.push(`\nBudget lines:`);
  for (const b of budget.data ?? []) lines.push(`- ${b.section}: ${b.label} (${b.direction}) est £${b.estimate ?? "?"} actual £${b.actual ?? "?"}`);
  return lines.join("\n");
}

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: name } = await sb.rpc("my_name");
  if (!name) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in Vercel yet." }, { status: 500 });
  }

  const { question, includeData, thread: rawThread } = (await req.json()) as { question: string; includeData?: boolean; thread?: string };
  const thread = (rawThread || (name as string)).slice(0, 40);
  if (!question?.trim()) return NextResponse.json({ error: "Empty question" }, { status: 400 });

  await sb.from("chat_messages").insert({ role: "user", content: question.trim(), author: name, thread });

  const { data: history } = await sb.from("chat_messages").select("role,content,author").eq("thread", thread).order("created_at", { ascending: false }).limit(20);
  const messages = (history ?? [])
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.role === "user" ? `${m.author ?? "User"}: ${m.content}` : m.content }));
  // API requires the first message to be from the user
  while (messages.length && messages[0].role !== "user") messages.shift();

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  let system = `You are helping Gareth and Kristin, a UK couple, plan a house move. They are leaving a large family house in Fulham, London, and downsizing to a London flat plus a cottage or house in the countryside, depending on budget. They aim to have moved by the end of March 2027. Today is ${today}.
This is ${thread}'s conversation (Gareth and Kristin each have their own, and each can read the other's); each question is prefixed with who asked it. Answer in British English, using UK law, tax, property practice and costs (SDLT in England, LTT in Wales, LBTT in Scotland; conveyancing, leasehold, EPCs, and so on). Be practical, concise and specific. Where something depends on facts you don't have, say what to check. You are not a lawyer, tax adviser or financial adviser, so flag when professional advice is needed.`;
  if (includeData !== false) system += `\n\nCurrent data from their Big Move app:\n${await buildContext(sb)}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async function ask(withSearch: boolean) {
    return client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages,
      ...(withSearch ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 } as Anthropic.WebSearchTool20250305] } : {}),
    });
  }

  let answer = "";
  try {
    let res;
    try {
      res = await ask(true);
    } catch {
      res = await ask(false);
    }
    answer = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Claude request failed" }, { status: 502 });
  }

  await sb.from("chat_messages").insert({ role: "assistant", content: answer || "(no answer)", author: "Claude", thread });
  return NextResponse.json({ answer });
}
