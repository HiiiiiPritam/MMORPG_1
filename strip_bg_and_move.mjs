import { Jimp } from 'jimp';
import fs from 'fs';

const boySrc = "C:\\Users\\ratsd\\.gemini\\antigravity\\brain\\21469152-37f9-439e-9296-212ea6e9f659\\boy_student_sprite_1772268016094.png";
const girlSrc = "C:\\Users\\ratsd\\.gemini\\antigravity\\brain\\21469152-37f9-439e-9296-212ea6e9f659\\girl_student_sprite_1772268049104.png";

const boyDest = "public/sprites/boy_student_sprite.png";
const girlDest = "public/sprites/girl_student_sprite.png";

async function stripBg(srcFile, destFile) {
    if (!fs.existsSync(srcFile)) {
        console.error("Missing source:", srcFile);
        return;
    }
    const image = await Jimp.read(srcFile);
    
    const targetColor = {
        r: image.bitmap.data[0],
        g: image.bitmap.data[1],
        b: image.bitmap.data[2]
    };

    const colorDistance = (r1, g1, b1, r2, g2, b2) => {
        return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
    };

    const tolerance = 60; 

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        if (colorDistance(r, g, b, targetColor.r, targetColor.g, targetColor.b) <= tolerance) {
            this.bitmap.data[idx + 3] = 0; // Alpha
        }
    });

    await image.writeAsync(destFile);
    console.log("Processed and saved to " + destFile);
}

await stripBg(boySrc, boyDest);
await stripBg(girlSrc, girlDest);
