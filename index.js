import gulp from "gulp";
import { readCurrentFolder, findImageFolder, ask, createFolder, sprite, compress } from './gulpfile.js';

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

gulp.task('generate',
        gulp.series(
            () => readCurrentFolder(filesInfo),
            () => findImageFolder(filesInfo),
            () => ask(imageConfig, filesInfo),
            () => createFolder(filesInfo),
            () => sprite(imageConfig, filesInfo),
            () => compress(imageConfig, filesInfo)
        )
    )