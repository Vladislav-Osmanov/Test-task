const { src, dest, series, watch } = require('gulp')
const concat = require('gulp-concat')
const htmlMin = require('gulp-htmlmin')
const autoprefixes = require('gulp-autoprefixer')
const sass = require('gulp-sass')(require('sass'))
const cleanCSS = require('gulp-clean-css')
const svgSprite = require('gulp-svg-sprite')
const imagemin = require('gulp-imagemin')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify-es').default
const notify = require('gulp-notify')
const sourcemaps = require('gulp-sourcemaps')
const del = require('del')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const browserSync = require('browser-sync').create()
const gulpif = require("gulp-if")
const plumber = require('gulp-plumber')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')

const fonts = () => {
  return src('src/fonts/**.*')
    .pipe(ttf2woff2())
    .pipe(dest('dist/fonts'))
}

let prod = false;

const isProd = (done) => {
  prod = true;
  done();
}

const clean = () => {
  return del(['dist'])
}

const resources = () => {
  return src('src/resources/**')
    .pipe(dest('dist'))
}

const styles = () => {
  return src('src/scss/**/main.scss')
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', notify.onError()))
    .pipe(autoprefixes({
      cascade: false
    }))
    .pipe(gulpif(prod, cleanCSS({
      level: 2
    })))
    .pipe(gulpif(!prod, sourcemaps.write()))
    .pipe(dest('dist/css'))
    .pipe(browserSync.stream())
}

const htmlMinify = () => {
  return src('src/**/*.html')
    .pipe(gulpif(prod, htmlMin({
      collapseWhitespace: true,
    })))
    .pipe(dest('dist'))
    .pipe(browserSync.stream())
}

const svgSprites = () => {
  return src('src/images/svg/**.svg')
    .pipe(gulpif(prod, svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg'
        }
      }
    })))
    .pipe(dest('dist/images'))
}

const scripts = () => {
  return src(
    'src/js/**/*.js'
  )
    .pipe(plumber(
      notify.onError({
        title: "JS",
        message: "Error: <%= error.message %>"
      })
    ))
    .pipe(webpackStream({
      mode: isProd ? 'production' : 'development',
      output: {
        filename: 'main.js',
      },
      module: {
        rules: [{
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: "defaults"
                }]
              ]
            }
          }
        }]
      },
      devtool: !isProd ? 'source-map' : false
    }))
    .on('error', function (err) {
      console.error('WEBPACK ERROR', err);
      this.emit('end');
    })
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream());
}


const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: 'dist'
    }
  })

  watch('src/**/*.html', htmlMinify)
  watch('src/scss/**/*.scss', styles)
  watch('src/images/svg/**.svg', svgSprites)
  watch('src/js/**/*.js', scripts)
  watch('src/resources/**', resources)
  watch('src/fonts/**.ttf', fonts)
  watch('src/images/**/*.*', imgmin)
}

const imgmin = () => {
  return src([
    'src/images/**/*.jpg',
    'src/images/**/*.png',
    'src/images/**/*.jpeg',
    'src/images/**/*.ico',
  ])
    .pipe(imagemin())
    .pipe(dest('dist/images'))
}

exports.styles = styles
exports.watchFiles = watchFiles
exports.scripts = scripts
exports.htmlMinify = htmlMinify
exports.clean = clean
exports.imgmin = imgmin
exports.svgSprites = svgSprites
exports.dev = series(clean, resources, htmlMinify, fonts, scripts, styles, imgmin, svgSprites, watchFiles)
exports.build = series(isProd, clean, resources, htmlMinify, fonts, scripts, styles, imgmin, svgSprites)
