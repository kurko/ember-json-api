var uglifyJavaScript = require('broccoli-uglify-js');
var pickFiles = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');
var env = require('broccoli-env').getEnv();
var compileES6 = require('broccoli-es6-concatenator');
var findBowerTrees = require('broccoli-bower');

var sourceTrees = [];

if (env === 'production') {

  // Build file
  var js = compileES6('src', {
    loaderFile: '../vendor/no-loader.js',
    inputFiles: [
      '**/*.js'
    ],
    wrapInEval: false,
    outputFile: '/ember-json-api.js'
  });

  var jsMinified = compileES6('src', {
    loaderFile: '../vendor/no-loader.js',
    inputFiles: [
      '**/*.js'
    ],
    wrapInEval: false,
    outputFile: '/ember-json-api.min.js'
  });

  var ugly = uglifyJavaScript(jsMinified, {
    mangle: true,
    compress: true
  });

  sourceTrees = sourceTrees.concat(js);
  sourceTrees = sourceTrees.concat(ugly);

} else if (env === 'development') {

  var src, vendor, bowerComponents;
  src = pickFiles('src', {
    srcDir: '/',
    destDir: '/src'
  });
  vendor = pickFiles('vendor', {
    srcDir: '/',
    destDir: '/vendor'
  });
  loaderJs = pickFiles('bower_components/loader.js', {
    srcDir: '/',
    files: ['loader.js'],
    destDir: '/vendor/loader.js'
  });

  sourceTrees = sourceTrees.concat(src);
  sourceTrees = sourceTrees.concat(findBowerTrees());
  sourceTrees = sourceTrees.concat(vendor);
  sourceTrees = sourceTrees.concat(loaderJs);
  var js = new mergeTrees(sourceTrees, { overwrite: true });

  js = compileES6(js, {
    loaderFile: 'vendor/loader.js/loader.js',
    inputFiles: [
      'src/**/*.js'
    ],
    legacyFilesToAppend: [
      'jquery.js',
      'qunit.js',
      'handlebars.js',
      'ember.debug.js',
      'ember-data.js'
    ],
    wrapInEval: true,
    outputFile: '/assets/app.js'
  });

  sourceTrees = sourceTrees.concat(js);

  var tests = pickFiles('tests', {
    srcDir: '/',
    destDir: '/tests'
  })
  sourceTrees.push(tests)

  sourceTrees = sourceTrees.concat(tests);

}
module.exports = mergeTrees(sourceTrees, { overwrite: true });
