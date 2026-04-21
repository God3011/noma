const fs = require('fs');
const { parse } = require('csv-parse/sync');
const csv = fs.readFileSync('./products.csv', 'utf-8');
const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });

const row = rows[0];
const barcodeKey = Object.keys(row).find(k => k.includes('barcode'));
const barcode = String(row[barcodeKey] || '').trim().replace(/\s/g, '');

console.log('barcodeKey found:', barcodeKey);
console.log('barcode value:', barcode);
console.log('barcode length:', barcode.length);
console.log('is empty:', barcode === '');
