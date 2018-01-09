let del = require('del')
let gulp = require('gulp')
let ts = require('gulp-typescript')
let mocha = require('gulp-mocha')

const tsProject = ts.createProject('tsconfig.json')


gulp.task('clean', function () {
    return del(['dist/*'])
})

gulp.task('tsc', gulp.series('clean', function typescript() {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'))
}))

gulp.task('test', function () {
    return gulp.src(['dist/test/**/**.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        }))
})

// gulp.task('compile', ['clean', 'tsc'])