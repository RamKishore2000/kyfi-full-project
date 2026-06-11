const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const pool = require("../config/db");

const TABLE_NAME = "site_hero_banner_settings";
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "site-banner");

function resolveExt(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "png";
  }
}

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    return null;
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

async function ensureBannerTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      desktop_image_path VARCHAR(255) DEFAULT NULL,
      desktop_image_name VARCHAR(255) DEFAULT NULL,
      mobile_image_path VARCHAR(255) DEFAULT NULL,
      mobile_image_name VARCHAR(255) DEFAULT NULL,
      mobile_image_path_2 VARCHAR(255) DEFAULT NULL,
      mobile_image_name_2 VARCHAR(255) DEFAULT NULL,
      mobile_image_path_3 VARCHAR(255) DEFAULT NULL,
      mobile_image_name_3 VARCHAR(255) DEFAULT NULL,
      updated_by_dealer_id INT UNSIGNED DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  await ensureBannerColumns();
  await pool.execute(`INSERT IGNORE INTO ${TABLE_NAME} (id) VALUES (1)`);
}

async function ensureBannerColumns() {
  const [columns] = await pool.execute(`SHOW COLUMNS FROM ${TABLE_NAME}`);
  const existingColumns = new Set(columns.map((column) => column.Field));
  const columnDefinitions = [
    ["mobile_image_path_2", "VARCHAR(255) DEFAULT NULL"],
    ["mobile_image_name_2", "VARCHAR(255) DEFAULT NULL"],
    ["mobile_image_path_3", "VARCHAR(255) DEFAULT NULL"],
    ["mobile_image_name_3", "VARCHAR(255) DEFAULT NULL"],
  ];

  for (const [columnName, definition] of columnDefinitions) {
    if (!existingColumns.has(columnName)) {
      await pool.execute(
        `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }
}

function buildRow(row) {
  if (!row) {
    return {
      desktopImagePath: null,
      desktopImageName: null,
      mobileImagePath: null,
      mobileImageName: null,
      mobileImagePath2: null,
      mobileImageName2: null,
      mobileImagePath3: null,
      mobileImageName3: null,
      updatedByDealerId: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  return {
    desktopImagePath: row.desktop_image_path,
    desktopImageName: row.desktop_image_name,
    mobileImagePath: row.mobile_image_path,
    mobileImageName: row.mobile_image_name,
    mobileImagePath2: row.mobile_image_path_2,
    mobileImageName2: row.mobile_image_name_2,
    mobileImagePath3: row.mobile_image_path_3,
    mobileImageName3: row.mobile_image_name_3,
    updatedByDealerId: row.updated_by_dealer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getHeroBannerSettings() {
  await ensureBannerTable();

  const [rows] = await pool.execute(
    `SELECT * FROM ${TABLE_NAME} WHERE id = 1 LIMIT 1`,
  );

  return buildRow(rows[0] || null);
}

async function saveBase64Image(dataUrl, prefix) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return null;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const extension = resolveExt(parsed.mimeType);
  const fileName = `${prefix}-${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(parsed.base64, "base64");

  await fs.writeFile(filePath, buffer);

  return {
    path: `/uploads/site-banner/${fileName}`,
    fileName,
  };
}

async function updateHeroBannerSettings({
  desktopImageDataUrl,
  mobileImageDataUrl,
  mobileImageDataUrls,
  updatedByDealerId,
}) {
  await ensureBannerTable();

  const current = await getHeroBannerSettings();
  const desktopImage = await saveBase64Image(desktopImageDataUrl, "desktop-banner");
  const requestedMobileImages = Array.isArray(mobileImageDataUrls)
    ? mobileImageDataUrls
    : [mobileImageDataUrl];
  const mobileImages = await Promise.all(
    requestedMobileImages
      .slice(0, 3)
      .map((dataUrl, index) => saveBase64Image(dataUrl, `mobile-banner-${index + 1}`)),
  );

  const nextDesktopPath = desktopImage?.path || current.desktopImagePath;
  const nextDesktopName = desktopImage?.fileName || current.desktopImageName;
  const nextMobilePath = mobileImages[0]?.path || current.mobileImagePath;
  const nextMobileName = mobileImages[0]?.fileName || current.mobileImageName;
  const nextMobilePath2 = mobileImages[1]?.path || current.mobileImagePath2;
  const nextMobileName2 = mobileImages[1]?.fileName || current.mobileImageName2;
  const nextMobilePath3 = mobileImages[2]?.path || current.mobileImagePath3;
  const nextMobileName3 = mobileImages[2]?.fileName || current.mobileImageName3;

  await pool.execute(
    `
      UPDATE ${TABLE_NAME}
      SET
        desktop_image_path = ?,
        desktop_image_name = ?,
        mobile_image_path = ?,
        mobile_image_name = ?,
        mobile_image_path_2 = ?,
        mobile_image_name_2 = ?,
        mobile_image_path_3 = ?,
        mobile_image_name_3 = ?,
        updated_by_dealer_id = ?
      WHERE id = 1
    `,
    [
      nextDesktopPath,
      nextDesktopName,
      nextMobilePath,
      nextMobileName,
      nextMobilePath2,
      nextMobileName2,
      nextMobilePath3,
      nextMobileName3,
      updatedByDealerId || null,
    ],
  );

  return getHeroBannerSettings();
}

module.exports = {
  getHeroBannerSettings,
  updateHeroBannerSettings,
};
