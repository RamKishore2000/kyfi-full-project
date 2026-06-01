require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { upsertMandals } = require("../src/services/mandal.service");

const SOURCES = [
  {
    stateName: "Andhra Pradesh",
    sourceLabel: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/List_of_mandals_of_Andhra_Pradesh",
  },
  {
    stateName: "Telangana",
    sourceLabel: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/List_of_mandals_in_Telangana",
  },
];

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#160;/g, " ");
}

function stripTags(html) {
  return decodeEntities(
    html
      .replace(/<sup[\s\S]*?<\/sup>/gi, "")
      .replace(/<span[\s\S]*?<\/span>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[\d+\]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractTableRows(html) {
  return Array.from(html.matchAll(/<tr[\s\S]*?<\/tr>/gi)).map((match) => match[0]);
}

function extractCells(rowHtml) {
  const cellMatches = Array.from(rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi));
  return cellMatches.map((match) => stripTags(match[1]));
}

function normalizeName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseAndhraPradesh(html) {
  const records = [];
  const rows = extractTableRows(html);

  for (const row of rows) {
    const cells = extractCells(row);
    if (cells.length < 3) continue;

    const [mandalName, revenueDivision, districtName] = cells;
    const firstCell = normalizeName(mandalName);

    if (!firstCell || /mandal/i.test(firstCell) || /revenue division/i.test(firstCell)) {
      continue;
    }

    if (!districtName || /district/i.test(districtName)) {
      continue;
    }

    records.push({
      stateName: "Andhra Pradesh",
      districtName: normalizeName(districtName),
      mandalName: firstCell,
      sourceLabel: `Wikipedia${revenueDivision ? ` - ${normalizeName(revenueDivision)}` : ""}`,
    });
  }

  return records;
}

function parseTelangana(html) {
  const records = [];
  const rows = extractTableRows(html);

  for (const row of rows) {
    const cells = extractCells(row);
    if (cells.length < 4) continue;

    const mandalName = normalizeName(cells[1]);
    const hierarchy = normalizeName(cells[3]);
    const districtMatch = hierarchy.match(/([A-Za-z .'-]+)\s*\(District\)/i);
    const districtName = districtMatch ? normalizeName(districtMatch[1]) : "";

    if (!mandalName || /subdistrict/i.test(mandalName) || /name/i.test(mandalName)) {
      continue;
    }

    if (!districtName) {
      continue;
    }

    records.push({
      stateName: "Telangana",
      districtName,
      mandalName,
      sourceLabel: "Wikipedia",
    });
  }

  return records;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function main() {
  const allRecords = [];

  for (const source of SOURCES) {
    console.log(`Fetching ${source.stateName} mandals...`);
    const html = await fetchHtml(source.url);
    console.log(`Fetched ${source.stateName} HTML (${html.length} chars). Parsing...`);
    const records =
      source.stateName === "Andhra Pradesh"
        ? parseAndhraPradesh(html)
        : parseTelangana(html);

    console.log(`Parsed ${records.length} ${source.stateName} mandals.`);
    allRecords.push(...records);
  }

  console.log(`Upserting ${allRecords.length} mandals into MySQL...`);
  const inserted = await upsertMandals(allRecords);
  const output = {
    totalSourceRecords: allRecords.length,
    inserted,
  };

  const outputPath = path.join(process.cwd(), "mandal-import-result.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
