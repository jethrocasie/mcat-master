/**
 * MCAT Flashcard Importer (plain Node.js — no TypeScript needed)
 * Usage: node scripts/import.js "C:\path\to\Flashcards.docx"
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf-8");
env.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === "your_supabase_service_role_key") {
  console.error("❌  Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.log('Usage: node scripts/import.js "C:\\path\\to\\Flashcards.docx"');
  process.exit(1);
}

// Parse DOCX (ZIP containing word/document.xml)
function parseDocx(filePath) {
  let AdmZip;
  try { AdmZip = require("adm-zip"); }
  catch { console.error("❌  Run: npm install adm-zip"); process.exit(1); }

  const zip = new AdmZip(filePath);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) { console.error("❌  Invalid DOCX file"); process.exit(1); }

  const xml = entry.getData().toString("utf-8");

  // Extract all text from <w:t> tags
  const matches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  const texts = matches.map(m => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);

  const cards = [];
  let currentTopic = "General";
  let i = 0;

  while (i < texts.length) {
    const text = texts[i];

    // Detect Q: prefix
    if (text.startsWith("Q:") || text === "Q") {
      let question = text.startsWith("Q:") ? text.slice(2).trim() : "";
      // Collect until A:
      i++;
      while (i < texts.length && !texts[i].startsWith("A:") && texts[i] !== "A") {
        question += " " + texts[i];
        i++;
      }
      question = question.trim();

      let answer = "";
      if (i < texts.length) {
        answer = texts[i].startsWith("A:") ? texts[i].slice(2).trim() : "";
        i++;
        // Collect answer lines until next Q: or section header
        while (i < texts.length && !texts[i].startsWith("Q:") && texts[i] !== "Q" && !isHeader(texts[i])) {
          answer += " " + texts[i];
          i++;
        }
        answer = answer.trim();
      }

      if (question && answer) {
        cards.push({ question, answer, topic: currentTopic });
      }
    } else if (isHeader(text)) {
      currentTopic = text.trim().slice(0, 100);
      i++;
    } else {
      i++;
    }
  }

  return cards;
}

function isHeader(text) {
  // All caps, no Q:/A: prefix, reasonably short
  return text.length > 3 && text.length < 80 &&
    text === text.toUpperCase() &&
    !text.startsWith("Q:") && !text.startsWith("A:") &&
    /[A-Z]/.test(text);
}

async function insertCards(cards) {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const rows = cards.map(c => ({
    mcat_section: "bio_biochem",
    topic: c.topic || "General",
    question: c.question,
    answer: c.answer,
    difficulty: 2,
  }));

  console.log(`\n⬆️  Inserting ${rows.length} cards...`);
  let inserted = 0;

  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await supabase.from("flashcards").insert(chunk);
    if (error) {
      console.error(`\n❌  Error on batch ${Math.floor(i/100)+1}:`, error.message);
    } else {
      inserted += chunk.length;
      process.stdout.write(`   ${inserted}/${rows.length} inserted...\r`);
    }
  }

  console.log(`\n\n🎉 Done! ${inserted} cards imported.`);
  console.log("Check Supabase → Table Editor → flashcards to verify.");
}

// Main
console.log(`\n📄 Reading: ${filePath}`);
const cards = parseDocx(filePath);
console.log(`   Found ${cards.length} cards`);

if (cards.length === 0) {
  console.log("⚠️  No cards found. The DOCX format may be different than expected.");
  process.exit(1);
}

// Show sample
console.log("\nSample cards:");
cards.slice(0, 3).forEach((c, i) => {
  console.log(`  ${i+1}. [${c.topic}] Q: ${c.question.slice(0, 60)}`);
  console.log(`      A: ${c.answer.slice(0, 60)}`);
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`\nImport ${cards.length} cards to Supabase? (y/N) `, async (answer) => {
  rl.close();
  if (answer.toLowerCase() !== "y") { console.log("Aborted."); process.exit(0); }
  await insertCards(cards);
});
