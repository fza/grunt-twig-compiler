/*
 * grunt-twig-compiler
 * https://github.com/fza/grunt-twig-compiler
 *
 * Copyright (c) 2013 fza
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {
  'use strict';

  var _ = grunt.util._,
    fsUtil = require('fs'),
    pathUtil = require('path'),
    twig = require('twig');

  grunt.registerMultiTask('twig', 'Compile *.twig templates with given options.', function () {
    var options = this.options({
        stripExtension: '.twig',
        preCompile: function (src) {
          return src;
        },
        compilerOptions: {}
      }),
      done = this.async(),
      fileCount = 0;

    grunt.verbose.writeflags(options, 'Options');

    this.files.forEach(function (f) {
      var dest = f.dest,
        destStat,
        doMkdir = false;

      try {
        destStat = fsUtil.statSync(dest);

        if (!destStat.isDirectory()) {
          grunt.log.warn('Destination "' + dest + '" exists, but is not a directory.');
          return false;
        }
      } catch (e) {
        doMkdir = true;
      }

      if (doMkdir) {
        fsUtil.mkdirSync(dest);
      }

      f.src
        .filter(function (filepath) {
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn('Source file "' + filepath + '" not found.');
            return false;
          } else {
            return true;
          }
        })
        .forEach(function (filepath) {
          var src = grunt.file.read(filepath),
            compiled,
            filepathExpanded = filepath.split('/'),
            filename = _.last(filepathExpanded),
            outputFile,
            templateId;

          if (options.stripExtension) {
            templateId = filename.substring(0, filename.indexOf(options.stripExtension));
          } else {
            templateId = filename;
          }

          outputFile = pathUtil.join(dest, templateId + '.compiled.js');
          if (fsUtil.existsSync(outputFile)) {
            fsUtil.unlinkSync(outputFile);
          }

          src = options.preCompile(src);

          try {
            var tpl = twig.twig({
                id: templateId,
                data: src
              }),
              output = tpl.compile(options.compilerOptions);

            fileCount++;

            fsUtil.writeFile(outputFile, output, function (err) {
              if (err) {
                throw {
                  err: err
                };
              } else {
                console.log("Compiled " + filename + "\t-> " + outputFile);
              }

              if(!--fileCount) {
                done();
              }
            });
          } catch (e) {
            console.log("Unable to compile " + filename + ", error " + e.err);
          }
        });
    });
  });

};
