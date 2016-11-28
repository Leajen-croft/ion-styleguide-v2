var gulp = require('gulp');
var gutil = require('gulp-util');
var tap = require('gulp-tap');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var rimraf = require('rimraf');
var Handlebars = require('handlebars');
var hljs = require('highlight.js');
var browserSync = require('browser-sync').create();
var yaml = require('js-yaml');
var fs = require('fs');

var md = require('markdown-it')({
  html: true,
  langPrefix:   'language-',
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(lang, str, true).value +
               '</code></pre>';
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});
var markdownItTocAndAnchor = require('markdown-it-toc-and-anchor').default;

md.use(markdownItTocAndAnchor, {
      tocFirstLevel: 2,
      tocLastLevel: 2,
      anchorLink: false
    });

function setupContainer(name) {
  md.use(require("markdown-it-container"), name, {
      render: function (tokens, idx) {
          if (tokens[idx].nesting === 1) {
            if(name === "half") {
              return '<div class="small-12 medium-6 large-6 columns">\n';
            } else if(name === "third") {
              return '<div class="small-12 medium-6 large-4 columns">\n';
            } else if(name === "quarter") {
              return '<div class="small-12 medium-6 large-3 columns">\n';
            } else if(name === "full") {
              return '<div class="small-12 columns">\n';
            }
          } else {
              return '</div>\n';
          }
      }
  });
}
setupContainer('half');
setupContainer('third');
setupContainer('quarter');
setupContainer('full');

var CONFIG = loadConfig();

function loadConfig() {
  var ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}
function markdownToHtml(file) {
    var result = md.render(file.contents.toString());
    file.contents = new Buffer(result);
    file.path = gutil.replaceExtension(file.path, '.html');
    return;
}
gulp.task('generate_pages', function(done) {
  // read the template from page.hbs
  return gulp.src('./src/page.hbs')
    .pipe(tap(function(file) {
      // file is page.hbs so generate template from file
      var template = Handlebars.compile(file.contents.toString());

      // now read all the pages from the pages directory
      return gulp.src('./src/**/*.md')
        // convert from markdown
        .pipe(tap(markdownToHtml))
        .pipe(tap(function(file) {
          // file is the converted HTML from the markdown
          // set the contents to the contents property on data
          var data = {
            contents: file.contents.toString()
          };
          // we will pass data to the Handlebars template to create the actual HTML to use
          var html = template(data);
          // replace the file contents with the new HTML created from the Handlebars template + data object that contains the HTML made from the markdown conversion
          file.contents = new Buffer(html, "utf-8");
        }))
        .pipe(gulp.dest(CONFIG.PATHS.dist))
        .pipe(browserSync.reload({stream: true}));
    }));
});
gulp.task('serve',['generate_pages', 'sass', 'copy'], function() {
    browserSync.init({
        server: {
            baseDir: CONFIG.PATHS.dist
        }
    });
});

gulp.task('copy', ['clean'], function(){
  return gulp.src(CONFIG.PATHS.assets)
          .pipe(gulp.dest(CONFIG.PATHS.dist + '/assets'));
});

gulp.task('clean', function clean(done) {
  rimraf(CONFIG.PATHS.dist, done);
});

gulp.task('sass', function () {
  return gulp.src(CONFIG.PATHS.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: CONFIG.COMPATIBILITY
    }))
    .pipe(gulp.dest(CONFIG.PATHS.dist + '/assets/css'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['serve'], function() {
  gulp.watch("./src/**/*.md", ['generate_pages']);
  gulp.watch("src/scss/**/*.scss", ['sass']);
});

gulp.task('default',['generate_pages', 'sass', 'copy', 'watch']);
