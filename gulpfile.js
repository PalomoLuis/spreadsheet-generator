import fs from 'node:fs';
import ReadLine from 'node:readline';
import gulp from 'gulp';
import spritesmith from 'gulp.spritesmith';
import imagemin, { mozjpeg, optipng } from 'gulp-imagemin';
import imageSanitizer from 'gulp-image-sanitizer';

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
                    console.log('Quality: ' + imageConfig.quality);
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

gulp.task('create-folder', function (cb) {
    fs.mkdir('./output', { recursive: true }, (err) => {
        if (err) console.error(err);
        cb()
    })
});

gulp.task('sprite', function () {
    const spriteData = gulp.src('images/*.png')
    .pipe(imageSanitizer([
      { width: imageConfig.width },
    ]))
    .pipe(spritesmith({
      imgName: `sprite.${imageConfig.type}`,
      cssName: 'sprite.css',
      algorithm: 'left-right',
      padding: 30
    }))
  
    return spriteData.pipe(gulp.dest('output/'));
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