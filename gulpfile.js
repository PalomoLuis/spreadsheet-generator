import fs from 'fs';
import ReadLine from 'readline';
import gulp from 'gulp';
import spritesmith from 'gulp.spritesmith';
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin';
import imageSanitizer from 'gulp-image-sanitizer';

/**
 * Sprite sheet generator:
 * Takes all the files in your images folder and create a spritesheet.
 */

const filesInfo = {
    files: 0,
    completeSize: 0
}

const imageConfig = {
    width: 300,
    type: 'jpeg',
    jpgQuality: 75,
    padding: 0
}

const showCompleteInfo = ( data ) => {
    const { filesInfo, imageConfig } = data;
    const table = new Object();
    table.images = filesInfo.files
    table.imageWidth = imageConfig.width
    table.padding = imageConfig.padding
    table.spriteWidth = filesInfo.completeSize
    table.type = imageConfig.type

    console.table(table)
}

const countFiles = () => {
    return new Promise((res, rej) => {
        fs.readdir('./images', function (err, files) {
            if(err) {
                rej(err);
                return;
            }
            filesInfo.files = files.length;
            filesInfo.completeSize = filesInfo.files * (imageConfig.width + imageConfig.padding);
            res(filesInfo)
        })
    })
}

const rl = ReadLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = query => new Promise(res => rl.question(query, res))

gulp.task('ask', async function () {
    console.log('\n')
    console.log('\x1b[43m%s\x1b[0m', ' Welcome to sprite generator! ')

    const size = parseInt(await question('Add the width of each image: '));
    (Number.isNaN(size) || size === undefined || size < 5 || size > 2000) ? imageConfig.width = 300 : imageConfig.width = size;
    console.log(imageConfig.width)

    const padding = parseInt(await question('Add the padding between images: '));
    (Number.isNaN(padding) || padding === undefined || padding < 0 || padding > 500) ? imageConfig.padding = 300 : imageConfig.padding = padding;
    console.log(imageConfig.padding)

    await countFiles()
    if(filesInfo.completeSize > 30000) {
        console.error('\x1b[31m%s\x1b[0m', 'ERROR: The sprite width exedes the max-width')
        gulp.stop()
        return
    }

    const type = await question('Write "jpeg" or "png" depending on the type you want: ');
    if(Number.isNaN(type) || type === undefined || Number.isInteger(type) || type !== 'jpeg') {
        type !== 'png' ? imageConfig.type = 'png' : imageConfig.type = type;
    } else { 
        imageConfig.type = type;
    }
    console.log('\x1b[33m%s\x1b[0m', imageConfig.type)

    let quality;
    if (imageConfig.type === 'jpeg') {
        quality = await question('Write the quality from 1 to 100: ');
        (Number.isNaN(quality) || quality === undefined || quality < 1 || quality > 100) ? imageConfig.quality = 75 : imageConfig.quality = quality;
        console.log('\x1b[33m%s\x1b[0m', imageConfig.quality)
    }

    console.log('\n')
    console.log('Configuration:')
    showCompleteInfo({ filesInfo, imageConfig })

    rl.close()
})

// gulp.task('ask', function (done) {
//     const rl = ReadLine.createInterface({
//         input: process.stdin,
//         output: process.stdout
//     });

//     rl.question('Add the width of each image: ', (size) => {
//         if(size === NaN || size === undefined) {
//             imageConfig.width = 300;
//         }
//         imageConfig.width = parseInt(size);
//         rl.question('Add the padding between images: ', (padding) => {
//             if(padding === NaN || padding === undefined) {
//                 imageConfig.padding = 0;
//             }
//             imageConfig.padding = parseInt(padding);
//             countFiles(filesInfo)
//             rl.question('Write "jpeg" or "png" depending on the type you want: ', (type) => {
//                 if(type === NaN || type === undefined) {
//                     imageConfig.type = 'png';
//                 }
//                 imageConfig.type = type.toString();
//                 if(imageConfig.type === 'jpeg') {
//                     rl.question('Write the quality from 1 to 100: ', (quality) => {
//                         imageConfig.jpgQuality = parseInt(quality);
//                         if(imageConfig.jpgQuality === NaN || imageConfig.jpgQuality === undefined) {
//                             imageConfig.jpgQuality = 70
//                         }
//                         showCompleteInfo({ filesInfo, imageConfig })
//                         rl.close()
//                         done()
//                     })
//                 } else {
//                     showCompleteInfo({ filesInfo, imageConfig })
//                     rl.close()
//                     done()
//                 }
//             })
//         })
//     })
// });

gulp.task('create-folder', async function (cb) {
    try {
        await fs.promises.mkdir('./output', { recursive: true }, (err) => {
            if (err) console.error(err);
            cb()
        })
    } catch (error) {
        console.log('Error')
    }
});

gulp.task('sprite', function () {
    return gulp.src(`images/*.png`)
    .pipe(imageSanitizer([
      { width: imageConfig.width },
    ]))
    .pipe(spritesmith({
      imgName: `sprite.${imageConfig.type}`,
      cssName: 'sprite.css',
      algorithm: 'left-right',
      padding: imageConfig.padding
    }))
    .pipe(gulp.dest('output/'));
});
   
gulp.task('compress', function() {
    return gulp.src(`output/sprite.${imageConfig.type}`)
    // .pipe(imageSanitizer([
    //     { width: 1000 },
    // ]))
    .pipe(imagemin([
        mozjpeg({quality: imageConfig.jpgQuality, progressive: true}),
        optipng({optimizationLevel: 5}),
    ]))
    .pipe(gulp.dest('output/'));
});

gulp.task('default', gulp.series('ask', 'create-folder', 'sprite', 'compress'));