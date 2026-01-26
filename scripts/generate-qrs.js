#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const dataPath = path.join(__dirname, "..", "data", "doctors.json");
const outDir = path.join(__dirname, "..", "qrcodes");
const baseUrl =
  process.env.QR_BASE_URL ||
  process.env.SITE_BASE_URL ||
  "https://medicos-test.ctrls.dev.br";

async function main() {
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);
  const doctors = parsed.doctors || [];

  fs.mkdirSync(outDir, { recursive: true });

  const csvRows = [["slug", "name", "url", "svg_file"]];

  for (const doctor of doctors) {
    if (!doctor.slug) continue;
    const url = `${baseUrl.replace(/\/$/, "")}/m/${doctor.slug}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 1 });
    const fileName = `${doctor.slug}.svg`;
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, svg, "utf8");
    csvRows.push([doctor.slug, doctor.name || "", url, fileName]);
  }

  const csvPath = path.join(outDir, "index.csv");
  const csv = csvRows.map((row) => row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  fs.writeFileSync(csvPath, csv, "utf8");

  console.log(`Gerados ${csvRows.length - 1} QR Codes em ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
