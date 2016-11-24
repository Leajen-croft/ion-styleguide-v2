var gulp = require('gulp');
var gutil = require('gulp-util');
var tap = require('gulp-tap');
var Handlebars = require('handlebars');
var md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true
});
var markdownItTocAndAnchor = require('markdown-it-toc-and-anchor').default;

md.use(markdownItTocAndAnchor, {
      tocFirstLevel: 2,
      tocLastLevel: 2,
      anchorLink: false
    });
md.use(require("markdown-it-container"),'block');
md.use(require('markdown-it-highlightjs'));

function markdownToHtml(file) {
    var result = md.render(file.contents.toString());
    file.contents = new Buffer(result);
    file.path = gutil.replaceExtension(file.path, '.html');
    return;
}
gulp.task('generate_pages', function() {
  // read the template from page.hbs
  return gulp.src('articles/page.hbs')
    .pipe(tap(function(file) {
      // file is page.hbs so generate template from file
      var template = Handlebars.compile(file.contents.toString());

      // now read all the pages from the pages directory
      return gulp.src('articles/**/*.md')
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
        .pipe(gulp.dest('build/pages'));
    }));
});
gulp.task('default',['generate_pages']);
