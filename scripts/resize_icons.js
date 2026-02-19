import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_ICON = 'public/icon-512.png';
const ANDROID_RES_DIR = 'android/app/src/main/res';

// Standard Android icon sizes
const SIZES = {
    'mipmap-mdpi': { foreground: 108, legacy: 48 },
    'mipmap-hdpi': { foreground: 162, legacy: 72 },
    'mipmap-xhdpi': { foreground: 216, legacy: 96 },
    'mipmap-xxhdpi': { foreground: 324, legacy: 144 },
    'mipmap-xxxhdpi': { foreground: 432, legacy: 192 }
};

async function processIcons() {
    console.log('Starting icon processing...');

    try {
        // 1. Create a "zoomed" version of the source icon
        // We crop the center 70% (removing padding) to make the logo larger
        const image = sharp(SOURCE_ICON);
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) throw new Error('Could not read image metadata');

        const cropSize = Math.floor(metadata.width * 0.70); // Crop to 70% of original size
        const cropOffset = Math.floor((metadata.width - cropSize) / 2);

        console.log(`Cropping detailed: ${cropSize}x${cropSize} at +${cropOffset}+${cropOffset}`);

        // Extract the center crop
        const croppedBuffer = await image
            .extract({ left: cropOffset, top: cropOffset, width: cropSize, height: cropSize })
            .toBuffer();

        // 2. Generate icons for each density
        for (const [dirName, sizes] of Object.entries(SIZES)) {
            const outDir = path.join(ANDROID_RES_DIR, dirName);

            if (!fs.existsSync(outDir)) {
                console.warn(`Directory ${outDir} does not exist, skipping.`);
                continue;
            }

            // Foreground (Adaptive)
            await sharp(croppedBuffer)
                .resize(sizes.foreground, sizes.foreground)
                .toFile(path.join(outDir, 'ic_launcher_foreground.png'));
            console.log(`Generated ${dirName}/ic_launcher_foreground.png (${sizes.foreground}px)`);

            // Legacy (Standard) - Using the cropped version might be too aggressive for legacy?
            // Actually, for legacy, we usually want the full icon including background.
            // But if the source has a lot of black padding, we might want to crop it a bit too, but maybe less?
            // Let's use the same cropped version for now as the user complained about "border".
            await sharp(croppedBuffer)
                .resize(sizes.legacy, sizes.legacy)
                .toFile(path.join(outDir, 'ic_launcher.png'));
            console.log(`Generated ${dirName}/ic_launcher.png (${sizes.legacy}px)`);

            // Round (Legacy)
            // For round icons, we should probably mask it to a circle?
            // Sharp can composite a circle mask.
            // But usually just resizing is enough if the launcher handles rounding.
            // HOWEVER, standard is pre-rounded?
            // Let's just resize for now. Launcher usually masks it.
            await sharp(croppedBuffer)
                .resize(sizes.legacy, sizes.legacy)
                .toFile(path.join(outDir, 'ic_launcher_round.png'));
            console.log(`Generated ${dirName}/ic_launcher_round.png (${sizes.legacy}px)`);
        }

        console.log('Icon processing complete!');

    } catch (error) {
        console.error('Error processing icons:', error);
        process.exit(1);
    }
}

processIcons();
