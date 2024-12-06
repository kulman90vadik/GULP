


import { src, dest, watch, parallel, series } from 'gulp';
import sass from 'gulp-sass'; // импортируем gulp-sass
import sassCompiler from 'sass'; // импортируем компилятор sass
import concat from 'gulp-concat';
import autoprefixer from 'gulp-autoprefixer';
import uglify from 'gulp-uglify';
import imagemin from 'gulp-imagemin';
import * as del from 'del';  // правильный импорт del
import browserSync from 'browser-sync';
import fileInclude from 'gulp-file-include';
import replace from 'gulp-replace';
import svgSprite from 'gulp-svg-sprite';
import cheerio from 'gulp-cheerio';

// Указываем компилятор Sass для gulp-sass
const sassConfig = sass(sassCompiler);

// Задачи Gulp
const svgSprites = () => {
    return src(['app/images/icons/**.svg'])
    .pipe(cheerio({
        run: function($) {
            $('[fill]').removeAttr('fill');
            $('[stroke]').removeAttr('stroke');
            $('[style]').removeAttr('style');
        },
        parserOptions: { xmlMode: true }
    }))
    .pipe(replace('&gt;', '>'))
    .pipe(svgSprite({
        mode: {
            stack: {
                sprite: "../sprite.svg"
            }
        }
    }))
    .pipe(dest('app/images'));
}

const htmlInclude = () => {
    return src(['app/html/*.html'])
    .pipe(fileInclude({
        prefix: '@',
        basepath: '@file'
    }))
    .pipe(dest('app'))
    .pipe(browserSync.stream());
}

const browsersync = () => {
    browserSync.init({
        server: {
            baseDir: 'app/'
        },
        notify: false
    });
}

const styles = () => {
    return src('app/scss/style.scss')
    .pipe(sassConfig({ outputStyle: 'compressed' }))  // используем sassConfig
    .pipe(concat('style.min.css'))
    .pipe(autoprefixer({
        overrideBrowserslist: ['last 10 versions'],
        grid: true
    }))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream());
}

const scripts = () => {
    return src([
        // 'node_modules/jquery/dist/jquery.js',
        // 'node_modules/wow.js/dist/wow.js',
        // 'node_modules/vivus/dist/vivus.js',
        'app/js/main.js'
    ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'));
}

const images = () => {
    return src('app/images/**/*.*')
    .pipe(imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
            plugins: [
                { removeViewBox: true },
                { cleanupIDs: false }
            ]
        })
    ]))
    .pipe(dest('dist/images'));
}

const build = () => {
    return src([
        'app/**/*.html',
        'app/css/style.min.css',
        'app/js/main.min.js'
    ], { base: 'app' })
    .pipe(dest('dist'));
}

const cleanDist = () => {
    return del('dist');
}

const watching = () => {
    watch(['app/scss/**/*.scss'], styles);
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
    watch(['app/**/*.html']).on('change', browserSync.reload);
    watch(['app/scss/**/*.scss']).on('change', browserSync.reload);
    watch(['app/html/**/*.html'], htmlInclude);
    watch(['app/images/icons/**.svg'], svgSprites);
}

// Экспортируем задачи
export { htmlInclude, svgSprites, styles, scripts, browsersync, watching, images, cleanDist, build };
export default parallel(styles, scripts, browsersync, watching, svgSprites, htmlInclude);
