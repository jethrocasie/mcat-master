/**
 * MCAT Master — Flashcard Import Script
 *
 * Imports cards from two sources:
 *   1. HTML file (JavaScript array format) — 285 cards
 *   2. DOCX file (XML inside ZIP, Q:/A: format) — 683 cards
 *
 * Usage:
 *   npx ts-node scripts/import-flashcards.ts \
 *     --html path/to/flashcards.html \
 *     --docx path/to/flashcards.docx
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js adm-zip dotenv
 *   (ts-node is already in devDependencies)
 */

import * as fs from "fs";
import * as path from "path";

// Load env vars
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf-8");
  env.split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

interface RawCard {
  question: string;
  answer: string;
  topic: string;
  subtopic?: string;
  source: "html" | "docx";
}

// ============================================================
// Parser 1: HTML file containing a JS array like:
//   var cards = [{q: "...", a: "...", section: "..."}, ...]
// ============================================================
function parseHtml(filePath: string): RawCard[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const cards: RawCard[] = [];

  // Try to extract a JS array of objects
  const arrayMatch = content.match(/\[[\s\S]*?\]/g);
  if (!arrayMatch) {
    console.warn("⚠️  No array found in HTML, trying line-by-line parse");
    return parseHtmlLineByLine(content);
  }

  // Find the largest match (likely the flashcards array)
  const largest = arrayMatch.sort((a, b) => b.length - a.length)[0];

  // Safely evaluate as JSON-like structure
  try {
    // Convert JS object syntax to JSON
    const jsonStr = largest
      .replace(/(\w+):/g, '"$1":')        // quote keys
      .replace(/'/g, '"')                   // single -> double quotes
      .replace(/,\s*}/g, "}")              // trailing commas
      .replace(/,\s*]/g, "]");

    const arr = JSON.parse(jsonStr);
    let currentTopic = "General";

    for (const item of arr) {
      const q = item.q || item.question || item.front || "";
      const a = item.a || item.answer || item.back || "";
      const topic = item.section || item.topic || item.category || currentTopic;

      if (q && a) {
        cards.push({
          question: q.trim(),
          answer: a.trim(),
          topic: normalizeTopic(topic),
          source: "html",
        });
      }
    }
  } catch {
    console.warn("⚠️  JSON parse failed, trying regex extraction");
    return parseHtmlLineByLine(content);
  }

  return cards;
}

function parseHtmlLineByLine(content: string): RawCard[] {
  const cards: RawCard[] = [];
  const lines = content.split("\n");
  let currentQ = "";
  let currentTopic = "General";

  for (const line of lines) {
    const qMatch = line.match(/['"q[uestion]*['"]\s*:\s*['"](.*?)['"]/i);
    const aMatch = line.match(/['"a[nswer]*['"]\s*:\s*['"](.*?)['"]/i);
    const topicMatch = line.match(/['"(?:section|topic|category)['"]\s*:\s*['"](.*?)['"]/i);

    if (topicMatch) currentTopic = topicMatch[1];
    if (qMatch) currentQ = qMatch[1];
    if (aMatch && currentQ) {
      cards.push({
        question: currentQ.trim(),
        answer: aMatch[1].trim(),
        topic: normalizeTopic(currentTopic),
        source: "html",
      });
      currentQ = "";
    }
  }

  return cards;
}

// ============================================================
// Parser 2: DOCX file (ZIP containing word/document.xml)
//   Parses Q: / A: pattern with section headers
// ============================================================
function parseDocx(filePath: string): RawCard[] {
  let AdmZip: typeof import("adm-zip");
  try {
    AdmZip = require("adm-zip");
  } catch {
    console.error(
      '❌  adm-zip not installed. Run: npm install adm-zip @types/adm-zip'
    );
    process.exit(1);
  }

  const zip = new AdmZip(filePath);
  const docEntry = zip.getEntry("word/document.xml");
  if (!docEntry) {
    console.error("❌  No word/document.xml in DOCX file");
    return [];
  }

  const xml = docEntry.getData().toString("utf-8");

  // Extract text from <w:t> tags
  const textNodes = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [];
  const rawText = textNodes
    .map((node) => node.replace(/<[^>]+>/g, "").trim())
    .filter((t) => t.length > 0)
    .join(" ");

  const cards: RawCard[] = [];
  const lines = rawText.split(/(?=[QA]:)/);

  let currentTopic = "General";
  let pendingQ = "";

  for (const line of lines) {
    // Detect section headers (all-caps or specific patterns)
    if (/^[A-Z\s\/]{10,}$/.test(line.trim()) && !line.startsWith("Q:")) {
      currentTopic = normalizeTopic(line.trim());
      continue;
    }

    const qMatch = line.match(/^Q:\s*(.+)/s);
    const aMatch = line.match(/^A:\s*(.+)/s);

    if (qMatch) {
      pendingQ = qMatch[1].trim();
    } else if (aMatch && pendingQ) {
      cards.push({
        question: pendingQ,
        answer: aMatch[1].trim(),
        topic: currentTopic,
        source: "docx",
      });
      pendingQ = "";
    }
  }

  return cards;
}

// ============================================================
// Deduplication: normalize and match on question text
// DOCX wins on conflicts (newer/more detailed)
// ============================================================
function deduplicateCards(
  htmlCards: RawCard[],
  docxCards: RawCard[]
): RawCard[] {
  const normalizedDocxQuestions = new Set(
    docxCards.map((c) => normalizeText(c.question))
  );

  const uniqueHtmlCards = htmlCards.filter(
    (c) => !normalizedDocxQuestions.has(normalizeText(c.question))
  );

  const all = [...docxCards, ...uniqueHtmlCards];

  // Remove duplicates within combined list
  const seen = new Set<string>();
  return all.filter((c) => {
    const key = normalizeText(c.question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 100);
}

function normalizeTopic(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[\d\.\-]+\s*/, "")
    .slice(0, 100) || "General";
}

// ============================================================
// Main
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const htmlIndex = args.indexOf("--html");
  const docxIndex = args.indexOf("--docx");

  const htmlPath = htmlIndex !== -1 ? args[htmlIndex + 1] : null;
  const docxPath = docxIndex !== -1 ? args[docxIndex + 1] : null;

  if (!htmlPath && !docxPath) {
    console.log("Usage: npx ts-node scripts/import-flashcards.ts --html file.html --docx file.docx");
    console.log("\nAt least one source file is required.");
    process.exit(1);
  }

  let htmlCards: RawCard[] = [];
  let docxCards: RawCard[] = [];

  if (htmlPath) {
    console.log(`\n📄 Parsing HTML: ${htmlPath}`);
    htmlCards = parseHtml(htmlPath);
    console.log(`   Found ${htmlCards.length} cards`);
  }

  if (docxPath) {
    console.log(`\n📄 Parsing DOCX: ${docxPath}`);
    docxCards = parseDocx(docxPath);
    console.log(`   Found ${docxCards.length} cards`);
  }

  const allCards = deduplicateCards(htmlCards, docxCards);
  console.log(`\n✅ After deduplication: ${allCards.length} unique cards`);

  // Preview
  console.log("\nSample cards:");
  allCards.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. [${c.topic}] Q: ${c.question.slice(0, 60)}...`);
  });

  // Confirm
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    `\nImport ${allCards.length} cards to Supabase? (y/N) `,
    async (answer: string) => {
      readline.close();
      if (answer.toLowerCase() !== "y") {
        console.log("Aborted.");
        process.exit(0);
      }

      console.log("\n⬆️  Uploading to Supabase...");

      // Dynamic import of Supabase
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      const rows = allCards.map((c) => ({
        mcat_section: "bio_biochem" as const, // default — update per section if known
        topic: c.topic,
        question: c.question,
        answer: c.answer,
        difficulty: 2,
      }));

      // Batch insert in chunks of 100
      let inserted = 0;
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from("flashcards").insert(chunk);
        if (error) {
          console.error(`❌  Error inserting batch ${i / chunkSize + 1}:`, error.message);
        } else {
          inserted += chunk.length;
          process.stdout.write(`   ${inserted}/${rows.length} inserted...\r`);
        }
      }

      console.log(`\n\n🎉 Done! ${inserted} flashcards imported successfully.`);
      console.log("You can view them in your Supabase dashboard → Table Editor → flashcards");
    }
  );
}

main().catch(console.error);
