module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! \n * <%= pkg.name %>\n * Built on ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' */\n'
    },

    concat: {
      options: {
        banner: '<%= meta.banner %>',
        process: function(src, filepath) {
          // wrap files in an anonymous function
          return '(function() {\n"use strict";\n' + src + '\n}).call(this);\n';
        }
      },
      dist: {
        src: [
          'src/json_api_serializer.js',
          'src/json_api_adapter.js'
        ],
        dest: 'dist/json_api_adapter.js'
      }
    },

    uglify: {
      dist: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          'dist/json_api_adapter.min.js': ['dist/json_api_adapter.js']
        }
      }
    },

    watch: {
      scripts: {
        files: ['src/**/*.js', 'lib/**/*.js'],
        tasks: ['concat', 'uglify']
      }
    }
  });

  [
    'grunt-contrib-concat',
    'grunt-contrib-uglify',
    'grunt-contrib-watch'
  ]
  .forEach(function(task) {
    grunt.loadNpmTasks(task);
  });

  grunt.registerTask('default', [
    'concat',
    'uglify'
  ]);

};
