const pool = require("../config/db");

const TABLE_NAME = "mandals";

async function ensureMandalsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      state_name VARCHAR(100) NOT NULL,
      district_name VARCHAR(150) NOT NULL,
      mandal_name VARCHAR(150) NOT NULL,
      source_label VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_mandal_state_district_name (state_name, district_name, mandal_name),
      KEY idx_mandal_state_district (state_name, district_name),
      KEY idx_mandal_name (mandal_name)
    )
  `);
}

async function listMandals({ stateName, districtName, query } = {}) {
  await ensureMandalsTable();

  const conditions = [];
  const params = [];

  if (stateName) {
    conditions.push("LOWER(state_name) = LOWER(?)");
    params.push(stateName);
  }

  if (districtName) {
    conditions.push("LOWER(district_name) = LOWER(?)");
    params.push(districtName);
  }

  if (query) {
    conditions.push("(mandal_name LIKE ? OR district_name LIKE ?)");
    const searchValue = `%${query}%`;
    params.push(searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute(
    `
      SELECT id, state_name, district_name, mandal_name, source_label, created_at, updated_at
      FROM ${TABLE_NAME}
      ${whereClause}
      ORDER BY state_name, district_name, mandal_name
      LIMIT 500
    `,
    params,
  );

  return rows;
}

async function upsertMandals(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return 0;
  }

  await ensureMandalsTable();

  const normalized = records
    .map((record) => ({
      stateName: String(record.stateName || "").trim(),
      districtName: String(record.districtName || "").trim(),
      mandalName: String(record.mandalName || "").trim(),
      sourceLabel: record.sourceLabel ? String(record.sourceLabel).trim() : null,
    }))
    .filter((record) => record.stateName && record.districtName && record.mandalName);

  if (normalized.length === 0) {
    return 0;
  }

  const chunkSize = 250;
  let inserted = 0;

  for (let index = 0; index < normalized.length; index += chunkSize) {
    const chunk = normalized.slice(index, index + chunkSize);
    const placeholders = chunk.map(() => "(?, ?, ?, ?)").join(", ");
    const values = chunk.flatMap((record) => [
      record.stateName,
      record.districtName,
      record.mandalName,
      record.sourceLabel,
    ]);

    const [result] = await pool.execute(
      `
        INSERT IGNORE INTO ${TABLE_NAME} (state_name, district_name, mandal_name, source_label)
        VALUES ${placeholders}
      `,
      values,
    );

    inserted += result.affectedRows || 0;
  }

  return inserted;
}

module.exports = {
  ensureMandalsTable,
  listMandals,
  upsertMandals,
};
