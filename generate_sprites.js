const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function processSprite(gender) {
    const inputPath = `public/sprites/${gender}_student_sprite.png`;
    const outputPath = `public/sprites/${gender}_student_sprite_animated.png`;
    
    if (!fs.existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        return;
    }

    const img = await loadImage(inputPath);
    const size = 640;
    
    const canvas = createCanvas(size * 4, size * 4);
    const ctx = canvas.getContext('2d');

    const drawFrame = (col, row, scaleX, offsetY, tint) => {
        ctx.save();
        // Move to center of frame
        ctx.translate(col * size + size/2, row * size + size/2 + offsetY);
        ctx.scale(scaleX, 1);
        
        ctx.drawImage(img, -size/2, -size/2, size, size);
        
        if (tint) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = tint;
            ctx.fillRect(-size/2, -size/2, size, size);
        }
        
        ctx.restore();
    };

    // Row 0: Down
    drawFrame(0, 0, 1, 0, null);
    drawFrame(1, 0, 0.95, -15, null);
    drawFrame(2, 0, 1, 0, null);
    drawFrame(3, 0, 0.95, -15, null);

    // Row 1: Left
    drawFrame(0, 1, 0.8, 0, null);
    drawFrame(1, 1, 0.75, -15, null);
    drawFrame(2, 1, 0.8, 0, null);
    drawFrame(3, 1, 0.75, -15, null);

    // Row 2: Right (flipped horizontally)
    drawFrame(0, 2, -0.8, 0, null);
    drawFrame(1, 2, -0.75, -15, null);
    drawFrame(2, 2, -0.8, 0, null);
    drawFrame(3, 2, -0.75, -15, null);

    // Row 3: Up (tinted to look like the back)
    const backTint = 'rgba(0,0,0,0.3)';
    drawFrame(0, 3, 1, 0, backTint);
    drawFrame(1, 3, 0.95, -15, backTint);
    drawFrame(2, 3, 1, 0, backTint);
    drawFrame(3, 3, 0.95, -15, backTint);

    // Save output
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Generated animated sprite sheet: ${outputPath}`);
    
    // Backup the original static image just in case
    fs.renameSync(inputPath, `public/sprites/${gender}_student_static.png`);
    // Rename our new animated one to be the default loaded by the engine
    fs.renameSync(outputPath, inputPath);
}

async function main() {
    await processSprite('boy');
    await processSprite('girl');
}

main().catch(console.error);
