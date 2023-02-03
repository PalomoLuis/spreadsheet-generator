import fs from 'fs';
import ReadLine from 'readline';
import gulp from 'gulp';
const { src, dest, series } = gulp;
import spritesmith from 'gulp.spritesmith';
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin';
import imageSanitizer from 'gulp-image-sanitizer';

/**
 * Sprite sheet generator:
 * Takes all the files in your images folder and create a spritesheet.
 */

const filesInfo = {
    currentFolder: null,
    files: 0,
    completeSize: 0,
    imagesFolder: null
}

const imageConfig = {
    width: 300,
    type: 'jpeg',
    jpgQuality: 75,
    padding: 0
}

const showCompleteInfo = ( data ) => {
    const { info, configuration } = data;
    const table = new Object();
    table.images = info.files
    table.imageWidth = configuration.width
    table.padding = configuration.padding
    table.spriteWidth = info.completeSize
    table.type = configuration.type

    console.table(table)
}

async function readCurrentFolder (info = filesInfo) {
    try {
        info.currentFolder = await process.cwd()
        // console.log('folder: ', info.currentFolder)
        return info.currentFolder
    } catch(err) {
        throw err()
    }
}

const findImageFolder = (info = filesInfo) => {
    return new Promise((res, rej) => {
        fs.readdir(info.currentFolder, (err, files) => {
            if(err) {
                rej(err);
                return;
            }
            info.imagesFolder = files.find(folder => folder === 'images')
            if (info.imagesFolder === undefined) {
                info.imagesFolder = files.find(folder => folder === 'img')
            }
            res(info.imagesFolder)
        }) 
    })
}


const countFiles = (info = filesInfo) => {
    return new Promise((res, rej) => {
        fs.readdir(`${info.currentFolder}/${info.imagesFolder}`, function (err, files) {
            if(err) {
                rej(err);
                return;
            }
            info.files = files.length;
            info.completeSize = info.files * (imageConfig.width + imageConfig.padding);
            console.log(`You have ${info.files} files to use.`)
            res(info)
        })
    })
}

gulp.task('fileshandler', series(readCurrentFolder, findImageFolder, countFiles))

const rl = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = query => new Promise(res => rl.question(query, res))

async function ask (configuration = imageConfig, info = filesInfo) {

    console.log('\n')
    console.log('\x1b[43m%s\x1b[0m', ' Welcome to sprite generator! ')

    const size = parseInt(await question('Add the width of each image: '));
    (Number.isNaN(size) || size === undefined || size < 5 || size > 2000) ? configuration.width = 300 : configuration.width = size;
    console.log(configuration.width)

    const padding = parseInt(await question('Add the padding between images: '));
    (Number.isNaN(padding) || padding === undefined || padding < 0 || padding > 500) ? configuration.padding = 0 : configuration.padding = padding;
    console.log(configuration.padding)

    await countFiles(info)
    if(info.completeSize > 30000) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: The sprite width exedes the max-width')
        gulp.stop()
        return
    }

    const type = await question('Write "jpeg" or "png" depending on the type you want: ');
    if(Number.isNaN(type) || type === undefined || Number.isInteger(type) || type !== 'jpeg') {
        type !== 'png' ? configuration.type = 'png' : configuration.type = type;
    } else { 
        configuration.type = type;
    }
    console.log('\x1b[33m%s\x1b[0m', configuration.type)

    let quality;
    if (configuration.type === 'jpeg') {
        quality = await question('Write the quality from 1 to 100: ');
        (Number.isNaN(quality) || quality === undefined || quality < 1 || quality > 100) ? configuration.quality = 75 : configuration.quality = quality;
        console.log('\x1b[33m%s\x1b[0m', configuration.quality)
    }

    console.log('\n')
    console.log('Configuration:')
    showCompleteInfo({ info, configuration })

    rl.close()
}

// function createFolder (info) {
//     return new Promise((res, rej) => {
//         fs.promises.mkdir(`${info.currentFolder}/${info.imagesFolder}/output`, { recursive: true }, (err) => {
//             if (err) {
//                 console.error(err)
//                 rej(err)
//             }
//             res('Output folder created')
//         })
//     })
// }
async function createFolder (info = filesInfo, cb) {
    try {
        await fs.promises.mkdir(`${info.currentFolder}/${info.imagesFolder}/output`, { recursive: true }, (err) => {
            if (err) console.error(err);
            cb()
        })
    } catch (error) {
        console.log('Error')
    }
}

function sprite (config = imageConfig, info = filesInfo) {
    return src(`${info.currentFolder}/${info.imagesFolder}/*.png`)
    .pipe(imageSanitizer([
      { width: config.width },
    ]))
    .pipe(spritesmith({
      imgName: `sprite.${config.type}`,
      cssName: 'sprite.css',
      algorithm: 'left-right',
      padding: config.padding
    }))
    .pipe(dest(`${info.currentFolder}/${info.imagesFolder}/output/`));
}

function compress (config = imageConfig, info = filesInfo) {
    return src(`${info.currentFolder}/${info.imagesFolder}/output/sprite.${config.type}`)
    // .pipe(imageSanitizer([
    //     { width: 1000 },
    // ]))
    .pipe(imagemin([
        mozjpeg({quality: config.jpgQuality, progressive: true}),
        optipng({optimizationLevel: 5}),
    ]))
    .pipe(dest(`${info.currentFolder}/${info.imagesFolder}/output/`));
}

export { readCurrentFolder }
export { findImageFolder }
export { countFiles }
export { ask }
export { createFolder }
export { sprite }
export { compress }

export default series(readCurrentFolder, findImageFolder, ask, createFolder, sprite, compress);
// export default readCurrentFolder;