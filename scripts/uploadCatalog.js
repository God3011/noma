const admin = require('firebase-admin');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccount.json')),
});

const db = admin.firestore();

async function upload() {
  const csvContent = fs.readFileSync('./products.csv', 'utf-8');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log('Total rows parsed:', rows.length);

  // Get the actual barcode key (handles BOM character)
  const barcodeKey = Object.keys(rows[0]).find(k => k.includes('barcode'));
  console.log('Using barcode key:', barcodeKey);

  // Test single write first
  console.log('\nTesting single document write...');
  const testRow = rows[0];
  const testBarcode = String(testRow[barcodeKey] || '').trim().replace(/\s/g, '');
  
  try {
    await db.collection('product_catalog').doc(testBarcode).set({
      barcode:   testBarcode,
      name:      String(testRow.name || '').trim(),
      brand:     String(testRow.brand || '').trim(),
      calories:  parseFloat(testRow.calories)  || 0,
      protein_g: parseFloat(testRow.protein_g) || 0,
      carbs_g:   parseFloat(testRow.carbs_g)   || 0,
      fat_g:     parseFloat(testRow.fat_g)     || 0,
      sugar_g:   parseFloat(testRow.sugar_g)   || 0,
      sodium_mg: parseFloat(testRow.sodium_mg) || 0,
      fiber_g:   parseFloat(testRow.fiber_g)   || 0,
      verified:  true,
      source:    'noma_verified',
    });
    console.log('Single write SUCCESS for barcode:', testBarcode);
  } catch (e) {
    console.error('Single write FAILED:', e.code, e.message);
    process.exit(1);
  }

  // Verify the single write
  const verify = await db.collection('product_catalog').doc(testBarcode).get();
  if (verify.exists) {
    console.log('Verified in Firestore:', verify.data().name);
  } else {
    console.error('Write reported success but document not found. Check Firestore rules.');
    process.exit(1);
  }

  // Now upload all rows one by one (slower but safer for debugging)
  console.log('\nUploading all', rows.length, 'products...');
  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const barcode = String(row[barcodeKey] || '').trim().replace(/\s/g, '');
    if (!barcode) { failed++; continue; }

    try {
      await db.collection('product_catalog').doc(barcode).set({
        barcode:   barcode,
        name:      String(row.name || '').trim(),
        brand:     String(row.brand || '').trim(),
        calories:  parseFloat(row.calories)  || 0,
        protein_g: parseFloat(row.protein_g) || 0,
        carbs_g:   parseFloat(row.carbs_g)   || 0,
        fat_g:     parseFloat(row.fat_g)     || 0,
        sugar_g:   parseFloat(row.sugar_g)   || 0,
        sodium_mg: parseFloat(row.sodium_mg) || 0,
        fiber_g:   parseFloat(row.fiber_g)   || 0,
        verified:  true,
        source:    'noma_verified',
      });
      success++;
      if (success % 100 === 0) console.log('Uploaded', success, '/', rows.length);
    } catch (e) {
      console.error('Failed on barcode', barcode, ':', e.message);
      failed++;
    }
  }

  console.log('\nDone!');
  console.log('Successfully uploaded:', success);
  console.log('Failed:', failed);
  process.exit(0);
}

upload().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
