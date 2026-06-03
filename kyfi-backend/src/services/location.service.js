const mysql = require("mysql2");
const db = require("../config/db");

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const columnExists = async (tableName, columnName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );

  return Number(rows[0]?.count || 0) > 0;
};

const indexExists = async (tableName, indexName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName],
  );

  return Number(rows[0]?.count || 0) > 0;
};

async function addColumnIfMissing(tableName, columnName, definition, afterColumn) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await db.execute(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}${afterColumn ? ` AFTER ${afterColumn}` : ""}`,
  );
}

async function addIndexIfMissing(tableName, indexName, definition) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await db.execute(`ALTER TABLE ${tableName} ADD INDEX ${indexName} (${definition})`);
}

async function addUniqueIndexIfMissing(tableName, indexName, definition) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await db.execute(`ALTER TABLE ${tableName} ADD UNIQUE KEY ${indexName} (${definition})`);
}

async function ensureDistrictsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS districts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      district_code VARCHAR(32) NOT NULL,
      district_name VARCHAR(150) NOT NULL,
      state_name VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_district_code (district_code),
      KEY idx_district_name (district_name),
      KEY idx_district_state_name (state_name)
    )
  `);

  await addColumnIfMissing("districts", "state_name", "VARCHAR(100) DEFAULT NULL", "district_name");
  await addUniqueIndexIfMissing("districts", "uq_district_code", "district_code");
  await addIndexIfMissing("districts", "idx_district_name", "district_name");
  await addIndexIfMissing("districts", "idx_district_state_name", "state_name");
}

async function ensureMandalsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mandals (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      state_name VARCHAR(100) DEFAULT NULL,
      district_name VARCHAR(150) DEFAULT NULL,
      mandal_name VARCHAR(150) NOT NULL,
      source_label VARCHAR(100) DEFAULT NULL,
      mandal_code VARCHAR(32) DEFAULT NULL,
      district_code VARCHAR(32) DEFAULT NULL,
      district_id BIGINT UNSIGNED DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_mandal_state_district_name (state_name, district_name, mandal_name),
      UNIQUE KEY uq_mandal_code (mandal_code),
      KEY idx_mandal_state_district (state_name, district_name),
      KEY idx_mandal_name (mandal_name),
      KEY idx_mandal_district_id (district_id),
      KEY idx_mandal_district_code (district_code)
    )
  `);

  await addColumnIfMissing("mandals", "mandal_code", "VARCHAR(32) DEFAULT NULL", "source_label");
  await addColumnIfMissing("mandals", "district_code", "VARCHAR(32) DEFAULT NULL", "mandal_code");
  await addColumnIfMissing("mandals", "district_id", "BIGINT UNSIGNED DEFAULT NULL", "district_code");
  await addUniqueIndexIfMissing("mandals", "uq_mandal_code", "mandal_code");
  await addIndexIfMissing("mandals", "idx_mandal_name", "mandal_name");
  await addIndexIfMissing("mandals", "idx_mandal_district_id", "district_id");
  await addIndexIfMissing("mandals", "idx_mandal_district_code", "district_code");
}

async function ensureVillagesTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS villages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      village_code VARCHAR(32) NOT NULL,
      village_name VARCHAR(150) NOT NULL,
      mandal_code VARCHAR(32) NOT NULL,
      mandal_id BIGINT UNSIGNED NOT NULL,
      district_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_village_code (village_code),
      KEY idx_village_name (village_name),
      KEY idx_village_mandal_id (mandal_id),
      KEY idx_village_district_id (district_id)
    )
  `);

  await addUniqueIndexIfMissing("villages", "uq_village_code", "village_code");
  await addIndexIfMissing("villages", "idx_village_name", "village_name");
  await addIndexIfMissing("villages", "idx_village_mandal_id", "mandal_id");
  await addIndexIfMissing("villages", "idx_village_district_id", "district_id");
}

async function ensureLocationSchema() {
  await ensureDistrictsTable();
  await ensureMandalsTable();
  await ensureVillagesTable();
}

async function bulkUpsert(tableName, columns, rows, updateColumns, chunkSize = 250) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }

  let affected = 0;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const placeholders = chunk.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
    const values = chunk.flatMap((row) => columns.map((column) => row[column]));
    const updateClause = updateColumns.map((column) => `${column} = VALUES(${column})`).join(", ");

    const [result] = await db.execute(
      `INSERT INTO ${tableName} (${columns.join(", ")})
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      values,
    );

    affected += result.affectedRows || 0;
  }

  return affected;
}

async function upsertDistricts(records) {
  await ensureDistrictsTable();

  const normalized = (Array.isArray(records) ? records : [])
    .map((record) => ({
      district_code: normalizeText(record.districtCode),
      district_name: normalizeText(record.districtName),
      state_name: normalizeText(record.stateName) || null,
    }))
    .filter((record) => record.district_code && record.district_name);

  return bulkUpsert(
    "districts",
    ["district_code", "district_name", "state_name"],
    normalized,
    ["district_name", "state_name"],
  );
}

async function upsertMandals(records) {
  await ensureLocationSchema();

  const normalized = (Array.isArray(records) ? records : [])
    .map((record) => ({
      state_name: normalizeText(record.stateName) || null,
      district_name: normalizeText(record.districtName) || null,
      mandal_name: normalizeText(record.mandalName),
      source_label: normalizeText(record.sourceLabel) || null,
      mandal_code: normalizeText(record.mandalCode),
      district_code: normalizeText(record.districtCode) || null,
      district_id: record.districtId ? Number(record.districtId) : null,
    }))
    .filter((record) => record.mandal_code && record.mandal_name);

  return bulkUpsert(
    "mandals",
    [
      "state_name",
      "district_name",
      "mandal_name",
      "source_label",
      "mandal_code",
      "district_code",
      "district_id",
    ],
    normalized,
    [
      "state_name",
      "district_name",
      "mandal_name",
      "source_label",
      "district_code",
      "district_id",
    ],
  );
}

async function upsertVillages(records) {
  await ensureLocationSchema();

  const normalized = (Array.isArray(records) ? records : [])
    .map((record) => ({
      village_code: normalizeText(record.villageCode),
      village_name: normalizeText(record.villageName),
      mandal_code: normalizeText(record.mandalCode),
      mandal_id: record.mandalId ? Number(record.mandalId) : null,
      district_id: record.districtId ? Number(record.districtId) : null,
    }))
    .filter((record) => record.village_code && record.village_name && record.mandal_code && record.mandal_id && record.district_id);

  return bulkUpsert(
    "villages",
    ["village_code", "village_name", "mandal_code", "mandal_id", "district_id"],
    normalized,
    ["village_name", "mandal_code", "mandal_id", "district_id"],
  );
}

async function upsertLocationHierarchy({ districts = [], mandals = [], villages = [] } = {}) {
  await ensureLocationSchema();

  await upsertDistricts(districts);

  const districtCodes = Array.from(
    new Set(
      districts
        .map((record) => normalizeText(record.districtCode))
        .filter(Boolean),
    ),
  );

  const districtMap = new Map();
  if (districtCodes.length) {
    const placeholders = districtCodes.map(() => "?").join(", ");
    const [districtRows] = await db.execute(
      `SELECT id, district_code, district_name, state_name
       FROM districts
       WHERE district_code IN (${placeholders})`,
      districtCodes,
    );

    for (const row of districtRows) {
      districtMap.set(String(row.district_code), row);
    }
  }

  const normalizedMandals = mandals
    .map((record) => {
      const districtCode = normalizeText(record.districtCode);
      const district = districtMap.get(districtCode);

      return {
        stateName: normalizeText(record.stateName) || district?.state_name || null,
        districtName: normalizeText(record.districtName) || district?.district_name || null,
        mandalName: normalizeText(record.mandalName),
        sourceLabel: normalizeText(record.sourceLabel) || null,
        mandalCode: normalizeText(record.mandalCode),
        districtCode: districtCode || null,
        districtId: district?.id ? Number(district.id) : null,
      };
    })
    .filter((record) => record.mandalCode && record.mandalName && record.districtId);

  await upsertMandals(normalizedMandals);

  const [mandalRows] = await db.query(
    `SELECT
      m.id,
      m.mandal_code,
      m.mandal_name,
      m.district_name,
      m.state_name,
      m.district_id
     FROM mandals m`,
  );

  const mandalCodeMap = new Map();
  const mandalLocationMap = new Map();

  for (const row of mandalRows) {
    if (row.mandal_code) {
      mandalCodeMap.set(normalizeText(row.mandal_code), row);
    }

    const locationKey = [
      normalizeText(row.state_name),
      normalizeText(row.district_name),
      normalizeText(row.mandal_name),
    ]
      .join("|")
      .toLowerCase();

    mandalLocationMap.set(locationKey, row);
  }

  const normalizedVillages = villages
    .map((record) => {
      const mandalCode = normalizeText(record.mandalCode);
      const mandalLocationKey = [
        normalizeText(record.stateName),
        normalizeText(record.districtName),
        normalizeText(record.mandalName),
      ]
        .join("|")
        .toLowerCase();

      const mandal = mandalCodeMap.get(mandalCode) || mandalLocationMap.get(mandalLocationKey);
      if (!mandal) return null;

      return {
        villageCode: normalizeText(record.villageCode),
        villageName: normalizeText(record.villageName),
        mandalCode: mandalCode || normalizeText(mandal.mandal_code),
        mandalId: Number(mandal.id),
        districtId: Number(mandal.district_id),
      };
    })
    .filter(Boolean);

  await upsertVillages(normalizedVillages);

  return {
    districts: districts.length,
    mandals: mandals.length,
    villages: villages.length,
  };
}

async function findMandalById(mandalId) {
  await ensureLocationSchema();

  const [rows] = await db.execute(
    `SELECT
      m.id,
      m.mandal_code,
      m.mandal_name,
      m.district_code,
      m.district_id,
      m.state_name,
      COALESCE(d.district_name, m.district_name) AS district_name,
      d.state_name AS district_state_name
     FROM mandals m
     LEFT JOIN districts d ON d.id = m.district_id
     WHERE m.id = ?
     LIMIT 1`,
    [mandalId],
  );

  return rows[0] || null;
}

async function findVillageById(villageId) {
  await ensureLocationSchema();

  const [rows] = await db.execute(
    `SELECT
      v.id,
      v.village_code,
      v.village_name,
      v.mandal_code,
      v.mandal_id,
      v.district_id,
      m.mandal_name,
      m.mandal_code AS parent_mandal_code,
      COALESCE(d.district_name, m.district_name) AS district_name,
      d.state_name AS state_name
     FROM villages v
     INNER JOIN mandals m ON m.id = v.mandal_id
     LEFT JOIN districts d ON d.id = v.district_id
     WHERE v.id = ?
     LIMIT 1`,
    [villageId],
  );

  return rows[0] || null;
}

async function listMandals({ stateName, districtName, query, limit = 500 } = {}) {
  await ensureLocationSchema();

  const conditions = ["1=1"];

  if (stateName) {
    conditions.push(`LOWER(COALESCE(d.state_name, m.state_name)) = LOWER(${mysql.escape(stateName)})`);
  }

  if (districtName) {
    conditions.push(`LOWER(COALESCE(d.district_name, m.district_name)) = LOWER(${mysql.escape(districtName)})`);
  }

  if (query) {
    conditions.push(`LOWER(m.mandal_name) LIKE LOWER(${mysql.escape(`${query}%`)})`);
  }

  const limitValue = Number(limit) || 500;

  const [rows] = await db.query(
    `SELECT
      m.id,
      m.mandal_code,
      m.mandal_name,
      m.district_code,
      m.district_id,
      m.source_label,
      m.created_at,
      m.updated_at,
      COALESCE(d.state_name, m.state_name) AS state_name,
      COALESCE(d.district_name, m.district_name) AS district_name
     FROM mandals m
     LEFT JOIN districts d ON d.id = m.district_id
     WHERE ${conditions.join(" AND ")}
     LIMIT ${limitValue}`,
  );

  return rows.sort((a, b) => {
    const aName = normalizeText(a.mandal_name).toLowerCase();
    const bName = normalizeText(b.mandal_name).toLowerCase();
    const needle = normalizeText(query).toLowerCase();

    const aRank = needle && aName === needle ? 0 : needle && aName.startsWith(needle) ? 1 : 2;
    const bRank = needle && bName === needle ? 0 : needle && bName.startsWith(needle) ? 1 : 2;

    if (aRank !== bRank) return aRank - bRank;
    return aName.localeCompare(bName);
  });
}

async function searchMandals({ query, limit = 20 } = {}) {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 3) {
    return [];
  }

  const rows = await listMandals({ query: normalizedQuery, limit });
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.mandal_name,
    mandalCode: row.mandal_code,
    districtId: row.district_id ? Number(row.district_id) : null,
    districtName: row.district_name || null,
    stateName: row.state_name || null,
  }));
}

async function listVillagesByMandal({ mandalId, query, limit = 1000 } = {}) {
  await ensureLocationSchema();

  const normalizedMandalId = Number(mandalId || 0);
  if (!Number.isFinite(normalizedMandalId) || normalizedMandalId <= 0) {
    return [];
  }

  const conditions = [`v.mandal_id = ${Number(normalizedMandalId)}`];

  const normalizedQuery = normalizeText(query);
  if (normalizedQuery) {
    conditions.push(`LOWER(v.village_name) LIKE LOWER(${mysql.escape(`${normalizedQuery}%`)})`);
  }

  const limitValue = Number(limit) || 1000;

  const [rows] = await db.query(
    `SELECT
      v.id,
      v.village_code,
      v.village_name,
      v.mandal_id,
      v.district_id,
      m.mandal_name,
      m.mandal_code,
      COALESCE(d.district_name, m.district_name) AS district_name,
      d.state_name AS state_name
     FROM villages v
     INNER JOIN mandals m ON m.id = v.mandal_id
     LEFT JOIN districts d ON d.id = v.district_id
     WHERE ${conditions.join(" AND ")}
     LIMIT ${limitValue}`,
  );

  return rows
    .sort((a, b) => {
      const aName = normalizeText(a.village_name).toLowerCase();
      const bName = normalizeText(b.village_name).toLowerCase();
      const needle = normalizeText(query).toLowerCase();

      const aRank = needle && aName === needle ? 0 : needle && aName.startsWith(needle) ? 1 : 2;
      const bRank = needle && bName === needle ? 0 : needle && bName.startsWith(needle) ? 1 : 2;

      if (aRank !== bRank) return aRank - bRank;
      return aName.localeCompare(bName);
    })
    .map((row) => ({
    id: Number(row.id),
    name: row.village_name,
    villageCode: row.village_code,
    mandalId: Number(row.mandal_id),
    districtId: row.district_id ? Number(row.district_id) : null,
    mandalName: row.mandal_name,
    districtName: row.district_name || null,
    stateName: row.state_name || null,
    }));
}

async function searchVillages({ mandalId, query, limit = 20 } = {}) {
  return listVillagesByMandal({ mandalId, query, limit });
}

async function searchDistricts({ query, limit = 20 } = {}) {
  await ensureLocationSchema();

  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const limitValue = Number(limit) || 20;
  const [rows] = await db.query(
    `SELECT id, district_code, district_name, state_name
     FROM districts
     WHERE LOWER(district_name) LIKE LOWER(${mysql.escape(`${normalizedQuery}%`)})
     LIMIT ${limitValue}`,
  );

  return rows.map((row) => ({
    id: Number(row.id),
    districtCode: row.district_code,
    name: row.district_name,
    stateName: row.state_name || null,
  }));
}

async function findDistrictById(districtId) {
  await ensureLocationSchema();

  const [rows] = await db.execute(
    `SELECT id, district_code, district_name, state_name
     FROM districts
     WHERE id = ?
     LIMIT 1`,
    [districtId],
  );

  return rows[0] || null;
}

function buildManualLocationCode(prefix) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
  return `${prefix}-${suffix}`;
}

async function createMandal({
  districtId,
  mandalName,
  mandalCode = null,
  sourceLabel = "manual",
}) {
  await ensureLocationSchema();

  const normalizedDistrictId = Number(districtId || 0);
  const normalizedMandalName = normalizeText(mandalName);
  if (!Number.isFinite(normalizedDistrictId) || normalizedDistrictId <= 0 || !normalizedMandalName) {
    throw new Error("District and mandal name are required");
  }

  const district = await findDistrictById(normalizedDistrictId);
  if (!district) {
    throw new Error("District not found");
  }

  const finalMandalCode = normalizeText(mandalCode) || buildManualLocationCode("MANUAL-MANDAL");

  await db.execute(
    `INSERT INTO mandals (
      state_name,
      district_name,
      mandal_name,
      source_label,
      mandal_code,
      district_code,
      district_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      state_name = VALUES(state_name),
      district_name = VALUES(district_name),
      source_label = VALUES(source_label),
      mandal_code = COALESCE(VALUES(mandal_code), mandal_code),
      district_code = COALESCE(VALUES(district_code), district_code),
      district_id = COALESCE(VALUES(district_id), district_id)`,
    [
      district.state_name || null,
      district.district_name,
      normalizedMandalName,
      sourceLabel,
      finalMandalCode,
      district.district_code,
      district.id,
    ],
  );

  const [rows] = await db.execute(
    `SELECT
      m.id,
      m.mandal_code,
      m.mandal_name,
      m.district_code,
      m.district_id,
      m.state_name,
      COALESCE(d.district_name, m.district_name) AS district_name,
      d.state_name AS district_state_name
     FROM mandals m
     LEFT JOIN districts d ON d.id = m.district_id
     WHERE m.district_id = ?
       AND LOWER(m.mandal_name) = LOWER(?)
     ORDER BY m.updated_at DESC
     LIMIT 1`,
    [district.id, normalizedMandalName],
  );

  return rows[0] || null;
}

async function createVillage({
  mandalId,
  villageName,
  villageCode = null,
}) {
  await ensureLocationSchema();

  const normalizedMandalId = Number(mandalId || 0);
  const normalizedVillageName = normalizeText(villageName);
  if (!Number.isFinite(normalizedMandalId) || normalizedMandalId <= 0 || !normalizedVillageName) {
    throw new Error("Mandal and village name are required");
  }

  const mandal = await findMandalById(normalizedMandalId);
  if (!mandal) {
    throw new Error("Mandal not found");
  }

  const finalVillageCode = normalizeText(villageCode) || buildManualLocationCode("MANUAL-VILLAGE");

  await db.execute(
    `INSERT INTO villages (
      village_code,
      village_name,
      mandal_code,
      mandal_id,
      district_id
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      village_name = VALUES(village_name),
      mandal_code = VALUES(mandal_code),
      mandal_id = VALUES(mandal_id),
      district_id = VALUES(district_id)`,
    [
      finalVillageCode,
      normalizedVillageName,
      normalizeText(mandal.mandal_code),
      mandal.id,
      mandal.district_id,
    ],
  );

  const [rows] = await db.execute(
    `SELECT
      v.id,
      v.village_code,
      v.village_name,
      v.mandal_id,
      v.district_id,
      m.mandal_name,
      m.mandal_code,
      COALESCE(d.district_name, m.district_name) AS district_name,
      d.state_name AS state_name
     FROM villages v
     INNER JOIN mandals m ON m.id = v.mandal_id
     LEFT JOIN districts d ON d.id = v.district_id
     WHERE v.village_code = ?
     LIMIT 1`,
    [finalVillageCode],
  );

  return rows[0] || null;
}

module.exports = {
  ensureLocationSchema,
  ensureDistrictsTable,
  ensureMandalsTable,
  ensureVillagesTable,
  upsertDistricts,
  upsertMandals,
  upsertVillages,
  upsertLocationHierarchy,
  findMandalById,
  findVillageById,
  findDistrictById,
  listMandals,
  searchMandals,
  listVillagesByMandal,
  searchVillages,
  searchDistricts,
  createMandal,
  createVillage,
};
