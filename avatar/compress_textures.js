const fs = require('fs');
const sharp = require('sharp');

async function compressGLB(inputPath, outputPath, maxSize = 512) {
    const buf = fs.readFileSync(inputPath);

    // Parse GLB header
    const jsonLen = buf.readUInt32LE(12);
    const jsonStart = 20;
    const json = JSON.parse(buf.slice(jsonStart, jsonStart + jsonLen).toString());

    const binStart = jsonStart + jsonLen + 8;
    const binBuf = buf.slice(binStart);

    const views = json.bufferViews;
    let newBin = Buffer.alloc(0);
    const offsets = new Array(views.length);

    for (let i = 0; i < views.length; i++) {
        const view = views[i];
        const chunk = binBuf.slice(view.byteOffset, view.byteOffset + view.byteLength);

        // Check if this bufferView is an image
        const isImage = json.images?.some(img => img.bufferView === i);

        let newChunk;
        if (isImage) {
            console.log(`Resizing image in bufferView ${i}: ${(chunk.length/1024/1024).toFixed(2)}MB`);
            newChunk = await sharp(chunk)
                .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
            // Update mime type
            const imgIdx = json.images.findIndex(img => img.bufferView === i);
            if (imgIdx !== -1) json.images[imgIdx].mimeType = 'image/jpeg';
            console.log(`  → ${(newChunk.length/1024/1024).toFixed(2)}MB`);
        } else {
            newChunk = chunk;
        }

        // Align to 4 bytes
        const pad = (4 - (newChunk.length % 4)) % 4;
        const padded = Buffer.concat([newChunk, Buffer.alloc(pad)]);

        offsets[i] = { offset: newBin.length, length: newChunk.length };
        newBin = Buffer.concat([newBin, padded]);
    }

    // Update bufferViews
    for (let i = 0; i < views.length; i++) {
        views[i].byteOffset = offsets[i].offset;
        views[i].byteLength = offsets[i].length;
    }
    json.buffers[0].byteLength = newBin.length;

    // Repack GLB
    const newJsonStr = JSON.stringify(json);
    const newJsonPad = (4 - (newJsonStr.length % 4)) % 4;
    const newJsonBuf = Buffer.from(newJsonStr + ' '.repeat(newJsonPad));

    const totalLen = 12 + 8 + newJsonBuf.length + 8 + newBin.length;
    const out = Buffer.alloc(totalLen);

    // GLB header
    out.writeUInt32LE(0x46546C67, 0); // magic
    out.writeUInt32LE(2, 4);           // version
    out.writeUInt32LE(totalLen, 8);    // total length

    // JSON chunk
    out.writeUInt32LE(newJsonBuf.length, 12);
    out.writeUInt32LE(0x4E4F534A, 16); // JSON
    newJsonBuf.copy(out, 20);

    // BIN chunk
    const binChunkStart = 20 + newJsonBuf.length;
    out.writeUInt32LE(newBin.length, binChunkStart);
    out.writeUInt32LE(0x004E4942, binChunkStart + 4); // BIN
    newBin.copy(out, binChunkStart + 8);

    fs.writeFileSync(outputPath, out);
    console.log(`\nDone! ${(fs.statSync(outputPath).size/1024/1024).toFixed(2)}MB → ${outputPath}`);
}

compressGLB(
    'Hitem3d-1775652959233.glb',
    'avatar_tiny.glb',
    512  // max texture dimension
).catch(console.error);
