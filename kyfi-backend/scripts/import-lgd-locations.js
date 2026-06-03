require("dotenv").config();

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const {
  upsertLocationHierarchy,
} = require("../src/services/location.service");

const DEFAULT_ARCHIVES = [
  {
    stateName: "Andhra Pradesh",
    archivePath:
      "C:\\Users\\electronics cart\\Downloads\\downloadDir2026_06_02_19_02_44_189 (1).zip",
  },
  {
    stateName: "Telangana",
    archivePath:
      "C:\\Users\\electronics cart\\Downloads\\downloadDir2026_06_02_19_06_09_371.zip",
  },
];

function decodeEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#160;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(text) {
  return decodeEntities(String(text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractRows(xml) {
  return Array.from(xml.matchAll(/<(?:\w+:)?Row\b[\s\S]*?<\/(?:\w+:)?Row>/gi)).map(
    (match) => match[0],
  );
}

function extractCells(rowXml) {
  return Array.from(
    rowXml.matchAll(/<(?:\w+:)?Data\b[^>]*>([\s\S]*?)<\/(?:\w+:)?Data>/gi),
  ).map((match) => stripTags(match[1]));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseDistrictSheet(xml, stateName) {
  const records = [];

  for (const row of extractRows(xml)) {
    const cells = extractCells(row);
    if (cells.length < 4) continue;

    const header = normalizeText(cells[1] || "");
    if (/district code/i.test(header) || /s\. no/i.test(normalizeText(cells[0] || ""))) {
      continue;
    }

    const districtCode = normalizeText(cells[1] || "");
    const districtName = normalizeText(cells[3] || cells[2] || "");

    if (!districtCode || !districtName) {
      continue;
    }

    records.push({
      stateName,
      districtCode,
      districtName,
    });
  }

  return records;
}

function parseSubDistrictSheet(xml, stateName) {
  const records = [];

  for (const row of extractRows(xml)) {
    const cells = extractCells(row);
    if (cells.length < 6) continue;

    const header = normalizeText(cells[1] || "");
    if (/district code/i.test(header) || /subdistrict code/i.test(header) || /s\.no/i.test(normalizeText(cells[0] || ""))) {
      continue;
    }

    const districtCode = normalizeText(cells[1] || "");
    const districtName = normalizeText(cells[2] || "");
    const mandalCode = normalizeText(cells[3] || "");
    const mandalName = normalizeText(cells[5] || "");

    if (!districtCode || !districtName || !mandalCode || !mandalName) {
      continue;
    }

    records.push({
      stateName,
      districtCode,
      districtName,
      mandalCode,
      mandalName,
    });
  }

  return records;
}

function parseVillageSheet(xml, stateName) {
  const records = [];

  for (const row of extractRows(xml)) {
    const cells = extractCells(row);
    if (cells.length < 8) continue;

    const header = normalizeText(cells[1] || "");
    if (/district code/i.test(header) || /sub-district code/i.test(header) || /village code/i.test(header) || /s\.no/i.test(normalizeText(cells[0] || ""))) {
      continue;
    }

    const districtCode = normalizeText(cells[1] || "");
    const districtName = normalizeText(cells[2] || "");
    const mandalCode = normalizeText(cells[3] || "");
    const mandalName = normalizeText(cells[4] || "");
    const villageCode = normalizeText(cells[5] || "");
    const villageName = normalizeText(cells[7] || "");

    if (!districtCode || !districtName || !mandalCode || !mandalName || !villageCode || !villageName) {
      continue;
    }

    records.push({
      stateName,
      districtCode,
      districtName,
      mandalCode,
      mandalName,
      villageCode,
      villageName,
    });
  }

  return records;
}

function walkFiles(rootDir) {
  const files = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function expandArchive(archivePath, destinationPath) {
  fs.mkdirSync(destinationPath, { recursive: true });
  execFileSync("tar", ["-xf", archivePath, "-C", destinationPath], {
    stdio: "inherit",
  });
}

function findSheet(files, keyword) {
  return files.find((file) => file.toLowerCase().includes(keyword.toLowerCase()));
}

async function main() {
  const archives = process.argv.slice(2).length
    ? process.argv.slice(2).map((archivePath) => ({
        stateName: /telangana/i.test(archivePath) ? "Telangana" : "Andhra Pradesh",
        archivePath,
      }))
    : DEFAULT_ARCHIVES;

  const allDistricts = [];
  const allMandals = [];
  const allVillages = [];

  for (const archive of archives) {
    if (!fs.existsSync(archive.archivePath)) {
      throw new Error(`Archive not found: ${archive.archivePath}`);
    }

    const tempRoot = path.join(process.cwd(), ".tmp-lgd-import");
    fs.mkdirSync(tempRoot, { recursive: true });
    const tempDir = fs.mkdtempSync(path.join(tempRoot, `${archive.stateName.replace(/\s+/g, "-").toLowerCase()}-`));
    console.log(`Extracting ${archive.stateName} archive to ${tempDir}...`);
    expandArchive(archive.archivePath, tempDir);

    const extractedFiles = walkFiles(tempDir);
    const districtSheet = findSheet(extractedFiles, "districtofspecificstate");
    const subDistrictSheet = findSheet(extractedFiles, "subdistrictofspecificstate");
    const villageSheet = findSheet(extractedFiles, "villageofspecificstate");

    if (!districtSheet || !subDistrictSheet || !villageSheet) {
      throw new Error(`Could not find all LGD sheets inside ${archive.archivePath}`);
    }

    const districtXml = fs.readFileSync(districtSheet, "utf8");
    const subDistrictXml = fs.readFileSync(subDistrictSheet, "utf8");
    const villageXml = fs.readFileSync(villageSheet, "utf8");

    const districtRecords = parseDistrictSheet(districtXml, archive.stateName);
    const mandalRecords = parseSubDistrictSheet(subDistrictXml, archive.stateName);
    const villageRecords = parseVillageSheet(villageXml, archive.stateName);

    console.log(
      `${archive.stateName}: parsed ${districtRecords.length} districts, ${mandalRecords.length} mandals, ${villageRecords.length} villages`,
    );

    allDistricts.push(...districtRecords);
    allMandals.push(...mandalRecords);
    allVillages.push(...villageRecords);
  }

  const uniqueDistricts = Array.from(
    new Map(allDistricts.map((record) => [record.districtCode, record])).values(),
  );
  const uniqueMandals = Array.from(
    new Map(allMandals.map((record) => [record.mandalCode, record])).values(),
  );
  const uniqueVillages = Array.from(
    new Map(allVillages.map((record) => [record.villageCode, record])).values(),
  );

  console.log(
    `Upserting ${uniqueDistricts.length} districts, ${uniqueMandals.length} mandals, ${uniqueVillages.length} villages...`,
  );

  const result = await upsertLocationHierarchy({
    districts: uniqueDistricts,
    mandals: uniqueMandals,
    villages: uniqueVillages,
  });

  const outputPath = path.join(process.cwd(), "lgd-location-import-result.json");
  const output = {
    archives: archives.map((archive) => archive.archivePath),
    parsed: {
      districts: uniqueDistricts.length,
      mandals: uniqueMandals.length,
      villages: uniqueVillages.length,
    },
    upserted: result,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
