/*
 * groups-react
 * Copyright (c) 2015 Steve Lee, KriaSoft LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

// Include Gulp and other build automation tools and utilities
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var del = require('del');
var path = require('path');



var browserify = require('browserify');
var watchify = require('watchify');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var runSequence = require('run-sequence');

var webpack = require('webpack');


var argv = require('minimist')(process.argv.slice(2));

// Settings
var RELEASE = !!argv.release;                 // Minimize and optimize during a build?
var AUTOPREFIXER_BROWSERS = [                 // https://github.com/ai/autoprefixer
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];


// Unified Watch Object
var watchFiles = {
  serverViews: ['app/views/**/*.*'],
  serverJS: ['gulpfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js', '!app/tests/'],
  clientViews: ['public/modules/**/views/**/*.html'],
  clientJS: ['public/js/*.js', 'public/modules/**/*.js'],
  clientCSS: ['public/modules/**/*.css'],
  mochaTests: ['app/tests/**/*.js'],
  images: 'public/assets/**/*'
};


var src = {};
var watch = false;

// The default task
gulp.task('default', ['sync']);

// Clean output directory
//gulp.task('clean', del.bind(
//  null, ['.tmp', 'build/*', '!build/.git'], {dot: true}
//));

// Clean
gulp.task('clean', function (cb) {
  //cb(del.sync(['dist/styles', 'dist/scripts', 'dist/images']));
  del(['build'], cb);
});

gulp.task('scripts', ['clean'], function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.scripts)
    .pipe(sourcemaps.init())
      .pipe(coffee())
      .pipe(uglify())
      .pipe(concat('all.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'));
});

// 3rd party libraries
gulp.task('vendor', function() {
  return gulp.src('node_modules/bootstrap/dist/fonts/**')
    .pipe(gulp.dest('build/fonts'));
});

// Static files
gulp.task('assets', function() {
  src.assets = [
    'src/assets/**',
    'src/content*/**/*.*',
    'src/templates*/**/*.*'
  ];
  return gulp.src(src.assets)
    .pipe($.changed('build'))
    .pipe(gulp.dest('build'))
    .pipe($.size({title: 'assets'}));
});

// CSS style sheets
gulp.task('styles', function() {
  src.styles = 'src/styles/**/*.{css,less}';
  return gulp.src('src/styles/bootstrap.less')
    .pipe($.plumber())
    .pipe($.less({
      sourceMap: !RELEASE,
      sourceMapBasepath: __dirname
    }))
    .on('error', console.error.bind(console))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.csscomb())
    .pipe($.if(RELEASE, $.minifyCss()))
    .pipe(gulp.dest('build/css'))
    .pipe($.size({title: 'styles'}));
});

// Bundle
gulp.task('bundle', function(cb) {
  var started = false;
  var config = require('./webpack.config.js');
  var bundler = webpack(config);

  function bundle(err, stats) {
    if (err) {
      throw new $.util.PluginError('webpack', err);
    }

    if (argv.verbose) {
      $.util.log('[webpack]', stats.toString({colors: true}));
    }

    if (!started) {
      started = true;
      return cb();
    }
  }

  if (watch) {
    bundler.watch(200, bundle);
  } else {
    bundler.run(bundle);
  }
});

// Build the app from source code
gulp.task('build', ['clean'], function(cb) {
  runSequence(['vendor', 'assets', 'styles', 'bundle'], cb);
});

// Build and start watching for modifications
gulp.task('build:watch', function(cb) {
  watch = true;
  runSequence('build', function() {
    gulp.watch(src.assets, ['assets']);
    gulp.watch(src.styles, ['styles']);
    cb();
  });
});

gulp.task('lint', function () {
  var jshint = require('gulp-jshint');

  gulp.src('./**/*.js')
    .pipe(jshint());
})

//nodemon
gulp.task('nodemon', function() {
  var nodemon = require('gulp-nodemon');
  var notify = require('gulp-notify');
  var livereload = require('gulp-livereload');

	// listen for changes
	livereload.listen();
	// configure nodemon
	nodemon({
		// the script to run the app
		script: 'server.js',
		ext: 'js'
	}).on('restart', function(){
		// when the app has restarted, run livereload.
		gulp.src('server.js')
			.pipe(livereload())
			.pipe(notify('Reloading page, please wait...'));
	})
});

// Launch a Node.js/Express server
gulp.task('serve', ['build:watch'], function(cb) {
  src.server = [
    'build/server.js',
    'build/content/**/*',
    'build/templates/**/*'
  ];

  var started = false;
  var cp = require('child_process');
  var assign = require('react/lib/Object.assign');

  var server = (function startup() {
    var child = cp.fork('build/server.js', {
      env: assign({NODE_ENV: 'development'}, process.env)
    });
    child.once('message', function(message) {
      if (message.match(/^online$/)) {
        if (browserSync) {
          browserSync.reload();
        }
        if (!started) {
          started = true;
          gulp.watch(src.server, function() {
            $.util.log('Restarting development server.');
            server.kill('SIGTERM');
            server = startup();
          });
          cb();
        }
      }
    });
    return child;
  })();

  process.on('exit', function() {
    server.kill('SIGTERM');
  });
});

// Launch BrowserSync development server
gulp.task('sync', ['serve'], function(cb) {
  browserSync = require('browser-sync');

  browserSync({
    notify: false,
    // Run as an https by setting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    https: false,
    // Informs browser-sync to proxy our Express app which would run
    // at the following location
    proxy: 'localhost:3000'
  }, cb);

  process.on('exit', function() {
    browserSync.exit();
  });

  gulp.watch(['build/**/*.*'].concat(
    src.server.map(function(file) {return '!' + file;})
  ), function(file) {
    browserSync.reload(path.relative(__dirname, file.path));
  });
});

// Deploy to GitHub Pages
gulp.task('deploy', function() {

  // Remove temp folder
  if (argv.clean) {
    var os = require('os');
    var repoPath = path.join(os.tmpdir(), 'tmpRepo');
    $.util.log('Delete ' + $.util.colors.magenta(repoPath));
    del.sync(repoPath, {force: true});
  }

  return gulp.src('build/**/*')
    .pipe($.if('**/robots.txt', !argv.production ?
      $.replace('Disallow:', 'Disallow: /') : $.util.noop()))
    .pipe($.ghPages({
      remoteUrl: 'https://github.com/{name}/{name}.github.io.git',
      branch: 'master'
    }));
});

// Run PageSpeed Insights
gulp.task('pagespeed', function(cb) {
  var pagespeed = require('psi');
  // Update the below URL to the public URL of your site
  pagespeed.output('example.com', {
    strategy: 'mobile'
    // By default we use the PageSpeed Insights free (no API key) tier.
    // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
    // key: 'YOUR_API_KEY'
  }, cb);
});
