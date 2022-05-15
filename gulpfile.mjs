import path, { dirname } from "path";

import autoprefixer from "autoprefixer";
import babel from "gulp-babel";
import browserSync from "browser-sync";
import concat from "gulp-concat";
import cssnano from "cssnano";
import dartSass from "sass";
import del from "del";
import dotenv from "dotenv";
import gulp from "gulp";
import gulpSass from "gulp-sass";
import htmlBeautify from "gulp-html-beautify";
import imagemin from "gulp-imagemin";
import notify from "gulp-notify";
import pngquant from "imagemin-pngquant";
import postCSS from "gulp-postcss";
import postcssPresetEnv from "postcss-preset-env";
import pug from "gulp-pug";
import rename from "gulp-rename";
import rtlcss from "gulp-rtlcss";
import sourcemaps from "gulp-sourcemaps";
import uglify from "gulp-uglify";
import zip from "gulp-zip";

browserSync.create();
dotenv.config();

const sass = gulpSass(dartSass);
const projectName = process.env.PROJECTNAME;
const projectPath = path.resolve(dirname("./"), projectName);
const context = path.resolve(dirname("./"), "./src");
const pathFiles = {
  pug: {
    src: context + "/views/*.pug",
    all: context + "/views/**/*.pug",
    dest: projectPath,
  },
  sass: {
    src: context + "/assets/styles/*.scss",
    all: context + "/assets/styles/**/*.scss",
    dest: projectPath + "/assets/css/",
  },
  css: {
    src: projectPath + "/assets/css/**/*.css",
    rtl: projectPath + "/assets/css/style.css",
    dest: projectPath + "/assets/css/",
  },
  es7: {
    src: context + "/assets/scripts/**/*.js",
    all: projectPath + "/assets/js/**/*.js",
    dest: projectPath + "/assets/js/",
  },
  fonts: {
    src: context + "/assets/fonts/**/*.{eot,svg,ttf,woff,woff2}",
    dest: projectPath + "/assets/fonts/",
  },
  images: {
    src: context + "/assets/images/**/*.{jpg,jpeg,png,svg,ico,gif}",
    dest: projectPath + "/assets/images/",
  },
  libraries: {
    src: context + "/assets/libraries/**/*",
    dest: projectPath + "/assets/libraries/",
  },
  uploads: {
    src: context + "/assets/uploads/**/*",
    dest: projectPath + "/assets/uploads/",
  },
};

/**
 * Clean build
 */
gulp.task("clean", () => {
  return del(projectPath);
});

gulp.task("clean:zip", () => {
  return del(projectPath + ".zip");
});

/**
 * Compile PugJs
 */
gulp.task("pug", () => {
  return gulp
    .src(pathFiles.pug.src)
    .pipe(
      pug().on(
        "error",
        notify.onError((error) => {
          return "An error occurred while compiling pug.\n" + error;
        })
      )
    )
    .pipe(htmlBeautify())
    .pipe(gulp.dest(pathFiles.pug.dest))
    .pipe(browserSync.stream());
});

/**
 * Compile Sass
 */
gulp.task("sass", () => {
  const plugins = [
    autoprefixer(),
    process.env.MODE === "production" ? cssnano() : "",
    postcssPresetEnv(),
  ];
  return gulp
    .src(pathFiles.sass.src)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
        errLogToConsole: true,
      }).on(
        "error",
        sass.logError
        // notify.onError(() => {
        //   return "An error occurred while compiling sass.\n" + sass.logError();
        // })
      )
    )
    .pipe(postCSS(plugins))
    .pipe(sourcemaps.write("./maps"))
    .pipe(gulp.dest(pathFiles.sass.dest))
    .pipe(browserSync.stream({ match: "**/*.css" }));
});

gulp.task("rtlcss", () => {
  return gulp
    .src(pathFiles.css.rtl)
    .pipe(rtlcss())
    .pipe(rename({ suffix: "-rtl" }))
    .pipe(gulp.dest(pathFiles.css.dest))
    .pipe(browserSync.stream({ match: "**/*.css" }));
});

gulp.task("css:min", () => {
  return gulp
    .src(pathFiles.css.src)
    .pipe(postCSS([cssnano()]))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(pathFiles.css.dest))
    .pipe(browserSync.stream({ match: "**/*.css" }));
});

/**
 * Compile ES7 Javascript
 */
gulp.task("es7", () => {
  return gulp
    .src(pathFiles.es7.src)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat("all.bundle.js"))
    .pipe(sourcemaps.write("./maps"))
    .pipe(gulp.dest(pathFiles.es7.dest))
    .pipe(browserSync.stream());
});

gulp.task("es7:min", () => {
  return gulp
    .src(pathFiles.es7.all)
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(gulp.dest(pathFiles.es7.dest))
    .pipe(browserSync.stream());
});

/**
 * Font files
 */
gulp.task("fonts", () => {
  return gulp
    .src(pathFiles.fonts.src)
    .pipe(gulp.dest(pathFiles.fonts.dest))
    .pipe(browserSync.stream());
});

/**
 * Image minify files
 */
gulp.task("images", () => {
  var configs = {
    progressive: true,
    svgoPlugins: [
      {
        removeViewBox: false,
      },
    ],
    use: [pngquant()],
  };

  return gulp
    .src(pathFiles.images.src, {
      since: gulp.lastRun("images"),
    })
    .pipe(
      imagemin(
        {
          optimizationLevel: 5,
        },
        configs
      )
    )
    .pipe(gulp.dest(pathFiles.images.dest))
    .pipe(browserSync.stream());
});

/**
 * Libraries files
 */
gulp.task("libraries", () => {
  return gulp
    .src(pathFiles.libraries.src)
    .pipe(gulp.dest(pathFiles.libraries.dest))
    .pipe(browserSync.stream());
});

/**
 * Upload files
 */
gulp.task("uploads", () => {
  return gulp
    .src(pathFiles.uploads.src)
    .pipe(gulp.dest(pathFiles.uploads.dest))
    .pipe(browserSync.stream());
});

/**
 * Zip project
 */
gulp.task("zipFiles", () => {
  return gulp
    .src(projectPath + "/**/*")
    .pipe(zip(projectName + ".zip"))
    .pipe(gulp.dest("./"));
});

/**
 * Start browserSync and watch change files
 */
gulp.task("watch", () => {
  browserSync.init({
    server: {
      baseDir: projectPath,
      directory: false,
    },
    port: process.env.PORT,
    ui: {
      port: process.env.PORTUI,
    },
  });

  gulp.watch(pathFiles.pug.all, gulp.series("pug"));
  gulp.watch(pathFiles.es7.src, gulp.series("es7"));
  gulp.watch(pathFiles.sass.all, gulp.series("sass"));
  gulp.watch(pathFiles.images.src, gulp.series("images"));
  gulp.watch(pathFiles.fonts.src, gulp.series("fonts"));
  gulp.watch(pathFiles.libraries.src, gulp.series("libraries"));
  gulp.watch(pathFiles.uploads.src, gulp.series("uploads"));
});

/**
 * Build files
 */
const build = gulp.series(
  "clean",
  gulp.parallel("pug", gulp.series("sass"), "es7"),
  gulp.parallel("images", "fonts", "libraries", "uploads")
);
gulp.task("build", build);

/**
 * Build zip files
 */
const buildZip = gulp.series("clean:zip", gulp.parallel("zipFiles"));
gulp.task("build:zip", buildZip);

/**
 * Export default task
 */
gulp.task("default", gulp.series("build", "watch"));
