import fs from 'fs';
import ReadLine from 'readline';
import gulp from 'gulp';
import spritesmith from 'gulp.spritesmith';
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin';
import imageSanitizer from 'gulp-image-sanitizer';

/**
 * Cosas por hacer:
 * 1) Sprites muy grandes en jpeg se rompen
 * 2) Validar inputs de consola y dejar un valor por defecto
 * 3) Contar files y mostrare en consola la suma de la imagen completa.
 *    Ejemplo: Si width es 100 y son 10 imágenes + 20 padding por imagen = console.log(1200);
 */

let imageConfig = {
    width: 300,
    type: 'jpeg',
    jpgQuality: 75
}

gulp.task('ask', function (done) {
    const rl = ReadLine.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Add the width of each image: ', (size) => {
        imageConfig.width = parseInt(size);
        console.log('Width: ' + imageConfig.width);
        rl.question('Write "jpeg" or "png" depending on the type you want: ', (type) => {
            imageConfig.type = type.toString();
            console.log('Type: ' + imageConfig.type);
            if(imageConfig.type === 'jpeg') {
                rl.question('Write the quality from 1 to 100: ', (quality) => {
                    imageConfig.jpgQuality = parseInt(quality);
                    if(imageConfig.jpgQuality === NaN || imageConfig.jpgQuality === undefined) {
                        imageConfig.jpgQuality = 70
                    }
                    console.log('Quality: ' + imageConfig.jpgQuality);
                    rl.close()
                    done()
                })
            } else {
                rl.close()
                done()
            }
        })
    })
});

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
      padding: 30
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