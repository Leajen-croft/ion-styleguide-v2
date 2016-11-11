var gulp = require('gulp');
var gutil = require('gulp-util');
var tap = require('gulp-tap');
var MarkdownIt = require('markdown-it');
var md = new MarkdownIt();
var markdownItTocAndAnchor = require('markdown-it-toc-and-anchor').default;

md.use(markdownItTocAndAnchor, {
      tocFirstLevel: 2,
      tocLastLevel: 2,
      anchorLink: false
    });
md.use(require("markdown-it-container"),'warning');
md.use(require('markdown-it-highlightjs'));


gulp.task('build', function() {
    return gulp.src('articles/**/*.md')
        .pipe(tap(markdownToHtml))
        .pipe(gulp.dest('./dist'));
});

function markdownToHtml(file) {
    var result = md.render(file.contents.toString());
    file.contents = new Buffer(result);
    file.path = gutil.replaceExtension(file.path, '.html');
    return;
}
