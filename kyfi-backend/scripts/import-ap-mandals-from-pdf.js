require("dotenv").config();

const fs = require("fs");
const zlib = require("zlib");
const pool = require("../src/config/db");
const { upsertMandals } = require("../src/services/mandal.service");

const PDF_PATH = "C:/Users/electronics cart/Downloads/ap_mandals_wikipedia.pdf";

const fontToCMap = {
  F4: 896,
  F5: 900,
  F6: 904,
  F26: 908,
  F27: 912,
  F849: 916,
  F850: 920,
};

function hexToUnicode(hex) {
  let out = "";
  for (let index = 0; index < hex.length; index += 4) {
    const chunk = hex.slice(index, index + 4);
    if (!chunk) continue;
    const codePoint = Number.parseInt(chunk, 16);
    if (Number.isFinite(codePoint) && codePoint > 0) {
      out += String.fromCodePoint(codePoint);
    }
  }
  return out;
}

function parseCMap(text) {
  const map = {};
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (/^\d+ beginbfchar$/.test(line)) {
      const count = Number(line.split(" ")[0]);
      for (let entry = 0; entry < count; entry += 1) {
        const current = lines[++index].trim();
        const match = current.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
        if (match) {
          map[match[1].toUpperCase().padStart(4, "0")] = hexToUnicode(match[2]);
        }
      }
      continue;
    }

    if (/^\d+ beginbfrange$/.test(line)) {
      const count = Number(line.split(" ")[0]);
      for (let entry = 0; entry < count; entry += 1) {
        const current = lines[++index].trim();
        const match = current.match(
          /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/,
        );
        if (!match) continue;

        let from = Number.parseInt(match[1], 16);
        const to = Number.parseInt(match[2], 16);
        let destination = Number.parseInt(match[3], 16);

        for (; from <= to; from += 1, destination += 1) {
          map[from.toString(16).toUpperCase().padStart(4, "0")] = hexToUnicode(
            destination.toString(16).toUpperCase().padStart(4, "0"),
          );
        }
      }
    }
  }

  return map;
}

function decodeHex(font, hex, cmapMaps) {
  const map = cmapMaps[font];
  if (!map) return "";

  let output = "";
  for (let index = 0; index < hex.length; index += 4) {
    const chunk = hex.slice(index, index + 4).toUpperCase();
    output += map[chunk] ?? "";
  }

  return output;
}

function getObjStream(pdfText, pdfBuffer, objectNumber) {
  const pattern = new RegExp(
    `${objectNumber}\\s+0\\s+obj\\s*<<[^>]*>>\\s*stream\\r?\\n`,
  );
  const match = pdfText.match(pattern);

  if (!match) return null;

  const start = match.index + match[0].length;
  const end = pdfText.indexOf("endstream", start);
  const raw = pdfBuffer.slice(start, end - 1);

  try {
    return zlib.inflateSync(raw).toString("utf8");
  } catch (error) {
    return raw.toString("utf8");
  }
}

function extractDecodedLines(pdfPath) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfText = pdfBuffer.toString("latin1");
  const cmapMaps = {};

  for (const [font, objectNumber] of Object.entries(fontToCMap)) {
    const cmapStream = getObjStream(pdfText, pdfBuffer, objectNumber);
    if (cmapStream) {
      cmapMaps[font] = parseCMap(cmapStream);
    }
  }

  const lines = [];
  let searchIndex = 0;

  while (true) {
    const streamIndex = pdfText.indexOf("stream", searchIndex);
    if (streamIndex < 0) break;

    const eol = pdfText[streamIndex + 6] === "\r" && pdfText[streamIndex + 7] === "\n" ? 2 : 1;
    const endIndex = pdfText.indexOf("endstream", streamIndex);
    const raw = pdfBuffer.slice(streamIndex + 6 + eol, endIndex - 1);

    let decodedStream;
    try {
      decodedStream = zlib.inflateSync(raw).toString("latin1");
    } catch (error) {
      searchIndex = endIndex + 9;
      continue;
    }

    if (decodedStream.includes("BT")) {
      const textBlocks = decodedStream.match(/BT[\s\S]*?ET/g) || [];

      for (const block of textBlocks) {
        let currentFont = "";
        const parts = [];
        const tokens = block.match(/\/F\d+|<[^>]+>|\([^)]*\)|Tf|Tj|TJ/g) || [];

        for (const token of tokens) {
          if (/^\/F\d+$/.test(token)) {
            currentFont = token.slice(1);
            continue;
          }

          if (token.startsWith("<") && token.endsWith(">")) {
            parts.push(decodeHex(currentFont, token.slice(1, -1), cmapMaps));
          }
        }

        if (parts.length) {
          lines.push(parts.join(""));
        }
      }
    }

    searchIndex = endIndex + 9;
  }

  return lines;
}

function parseMandals(lines) {
  const cleanLines = lines.map((line) => line.trim()).filter(Boolean);
  const headerIndex = cleanLines.findIndex((line) => line === "District");

  if (headerIndex === -1) {
    throw new Error("Could not find the mandal table header in the PDF.");
  }

  const tableLines = cleanLines.slice(headerIndex + 1);
  const records = [];
  let currentDistrict = "";

  for (let index = 0; index < tableLines.length; index += 1) {
    const line = tableLines[index];

    if (!/^\d+$/.test(line)) {
      continue;
    }

    const mandalName = (tableLines[index + 1] || "")
      .replace(/\s+mandal$/i, "")
      .replace(/\s+Mandal$/i, "")
      .trim();

    let districtName = currentDistrict;

    for (
      let cursor = index + 2;
      cursor < tableLines.length && !/^\d+$/.test(tableLines[cursor]);
      cursor += 1
    ) {
      const candidate = tableLines[cursor].replace(/\s+/g, " ").trim();

      if (/district$/i.test(candidate)) {
        districtName = candidate.replace(/\s+district$/i, "").trim();
        currentDistrict = districtName;
      }
    }

    if (!mandalName || !/[A-Za-z]/.test(mandalName)) {
      continue;
    }

    if (!districtName) {
      continue;
    }

    if (/^[\[\]\.\-]+$/.test(mandalName)) {
      continue;
    }

    records.push({
      stateName: "Andhra Pradesh",
      districtName,
      mandalName,
      sourceLabel: "Wikipedia PDF",
    });
  }

  return records;
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF not found: ${PDF_PATH}`);
  }

  console.log("Decoding AP mandals PDF...");
  const decodedLines = extractDecodedLines(PDF_PATH);
  fs.writeFileSync(
    "ap_mandals_decoded_lines.txt",
    decodedLines.join("\n"),
    "utf8",
  );

  const records = parseMandals(decodedLines);
  fs.writeFileSync(
    "ap_mandals_records.json",
    JSON.stringify(records, null, 2),
    "utf8",
  );

  console.log(`Parsed ${records.length} AP mandals. Importing into MySQL...`);
  const inserted = await upsertMandals(records);

  console.log(
    JSON.stringify(
      {
        parsed: records.length,
        inserted,
      },
      null,
      2,
    ),
  );

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
