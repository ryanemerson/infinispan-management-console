'use strict';

var gulp = require('gulp');

var plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'del', 'q', 'run-sequence']
});

var paths = {
  scripts: 'src/main/webapp/**/*.js',
  styles: ['src/main/webapp/**/*.less','src/main/webapp/**/*.css'],
  images: 'src/main/assets/images/**/*',
  languages: 'src/main/assets/languages/*',
  index: 'src/main/webapp/index.html',
  partials: ['src/main/webapp/**/*.html', '!src/main/webapp/index.html'],
  buildDir: '.tmp',
  distDir: 'dist',
  components: '/built_components',
  componentsDeep: '/built_components/**'
};

var filters = {
  build: plugins.filter(['**', '!*/*.{md,json,gzip,map}']),
  dist: plugins.filter(['**', '*/*.{min.js,css,map}', '*/{dist,css,less,min.js,fonts,release,components/font-awesome}/**']),
  fonts: plugins.filter(['**', '**/*.{eot,svg,ttf,woff}'])
};

function handleError(err) {
  console.error(err.toString());
  this.emit('end');
}


gulp.task('styles', function() {
  return gulp.src('src/main/webapp/management-console.less')
    .pipe(plugins.less({
      paths: [
        paths.distDir + paths.components
      ]
    }))
    .on('error', handleError)
    .pipe(plugins.autoprefixer('last 1 version'))
    .pipe(gulp.dest(paths.distDir))
    .pipe(gulp.dest(paths.buildDir))
    .pipe(plugins.size());
});

gulp.task('partials', function() {
  return gulp.src(paths.partials)
    .pipe(gulp.dest(paths.distDir))
    .pipe(gulp.dest(paths.buildDir))
    .pipe(plugins.size());
});

gulp.task('index', function() {
  return gulp.src(paths.index)
    .pipe(gulp.dest(paths.distDir))
    .pipe(gulp.dest(paths.buildDir))
    .pipe(plugins.size());
});

gulp.task('languages', function() {
  var destPath = paths.distDir + '/assets/languages';
  var buildPath = paths.buildDir + '/assets/languages';

  return gulp.src(paths.languages)
    .pipe(gulp.dest(destPath))
    .pipe(gulp.dest(buildPath))
    .pipe(plugins.size());
});

gulp.task('images', function() {
  var destPath = paths.distDir + '/assets/images';
  var buildPath = paths.buildDir + '/assets/images';

  return gulp.src(paths.images)
    .pipe(plugins.cache(plugins.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest(destPath))
    .pipe(gulp.dest(buildPath))
    .pipe(plugins.size());
});

gulp.task('fonts', function() {
  //grab everything in built_components dir, find all filtered files and copy them
  return gulp.src(paths.distDir + paths.componentsDeep)
    .pipe(filters.fonts)
    .pipe(gulp.dest(paths.distDir + paths.componentsDeep))
    .pipe(gulp.dest(paths.buildDir + paths.componentsDeep))
    .pipe(plugins.size());
});

// Filters not working
gulp.task('copy-comps', function () {
  return gulp.src(plugins.npmFiles(), { base: './node_modules' })
    .pipe(filters.build)
    .pipe(gulp.dest(paths.buildDir + paths.components))
    .pipe(filters.dist)
    .pipe(gulp.dest(paths.distDir + paths.components));
});

gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .pipe(plugins.concat('main.js'))
    .pipe(gulp.dest(paths.buildDir))
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify())
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('clean', function () {
  return plugins.del([paths.buildDir, paths.distDir]);
});

gulp.task('build', ['clean'], function (cb) {
  plugins.runSequence('copy-comps', [
  'scripts',
  'fonts',
  'images',
  'languages',
  'partials'
  ], 'styles', cb);
});

