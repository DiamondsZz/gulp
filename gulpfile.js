const { src, dest, parallel, series, watch } = require("gulp");

const del = require("del");

const loadPlugins = require("gulp-load-plugins");

const plugins = loadPlugins();

const browserSync = require("browser-sync");

const browserServer = browserSync.create();

//页面数据
const data = {
  menus: [
    {
      name: "Home",
      icon: "aperture",
      link: "index.html",
    },
    {
      name: "About",
      link: "about.html",
    },
  ],
  pkg: require("./package.json"),
  date: new Date(),
};

//样式编译
const style = () => {
  return (
    src("src/assets/styles/*.scss", { base: "src" })
      .pipe(plugins.sass({ outputStyle: "expanded" }))
      //临时目录
      .pipe(dest("temp"))
      .pipe(
        //以流的方式重新加载
        browserServer.reload({ stream: true })
      )
  );
};
//脚本编译
const script = () => {
  return (
    src("src/assets/scripts/*.js", { base: "src" })
      .pipe(plugins.babel({ presets: ["@babel/preset-env"] }))
      //临时目录
      .pipe(dest("temp"))
      .pipe(
        //以流的方式重新加载
        browserServer.reload({ stream: true })
      )
  );
};

//脚本编译
const page = () => {
  return (
    src("src/**/*.html", { base: "src" })
      .pipe(
        plugins.swig({
          // defaults: {
          //   //不缓存
          //   cache: false,
          // },
          data,
        })
      )
      //临时目录
      .pipe(dest("temp"))
      .pipe(
        //以流的方式重新加载
        browserServer.reload({ stream: true })
      )
  );
};
//图片编译
const image = () => {
  return src("src/assets/images/**", { base: "src" })
    .pipe(plugins.imagemin())
    .pipe(dest("dist"));
};
//字体编译
const font = () => {
  return src("src/assets/fonts/**", { base: "src" })
    .pipe(plugins.imagemin())
    .pipe(dest("dist"));
};

//其它文件
const extra = () => {
  return src("src/public/**", { base: "src" }).pipe(dest("dist"));
};

//清除文件
const clean = () => {
  return del(["dist", "temp"]);
};

//html css js文件合并
const useref = () => {
  return (
    src("temp/**/*.html", { base: "temp" })
      //通过构建注释合并css js文件
      .pipe(plugins.useref({ searchPath: ["temp", "."] }))
      //压缩js
      .pipe(plugins.if(/\.js$/, plugins.uglify()))
      //压缩css
      .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
      //压缩html
      .pipe(
        plugins.if(
          /\.html$/,
          plugins.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
          })
        )
      )
      .pipe(dest("dist"))
  );
};

//服务器
const server = () => {
  watch("src/assets/styles/*.scss", style);
  watch("src/assets/scripts/*.js", script);
  watch("src/**/*.html", page);
  //图片、字体
  watch(
    ["src/assets/images/**", "src/assets/fonts/**", "public/**"],
    browserServer.reload
  );

  //初始化服务器
  browserServer.init({
    //端口
    port: 2080,
    //监听temp下所有文件
    //files: "temp/**",
    //默认打开
    open: true,
    server: {
      //基准路径
      baseDir: ["temp", "src", "public"],
      //路由匹配
      routes: {
        "/node_modules": "node_modules",
      },
    },
  });
};

const compile = parallel(style, script, page);

const develop = series(compile, server);

const build = series(
  clean,
  parallel(series(compile, useref), image, font, extra)
);

module.exports = {
  clean,
  compile,
  build,
  develop,
};
