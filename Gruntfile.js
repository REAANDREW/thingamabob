'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    require: 'test/blanket',
                    //grep: 'Zat'
                },
                src: ['test/**/*.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    require: 'test/blanket',
                    quiet: true,
                    captureFile: 'coverage.html'
                },
                src: ['test/**/*.js']
            },
            jenkinsCov: {
                options: {
                    reporter: 'mocha-cobertura-reporter',
                    require: 'test/blanket',
                    quiet: true,
                    captureFile: 'coverage.xml'
                },
                src: ['test/**/*.js']
            },
            jenkinsCount: {
                options: {
                    reporter: 'mocha-jenkins-reporter',
                    quiet: true
                },
                src: ['test/**/*.js']
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib: {
                src: ['lib/**/*.js']
            },
            test: {
                src: ['test/**/*.js']
            },
            bin: {
                src: ['bin/*']
            },
            jenkins: {
                options: {
                    jshintrc: '.jshintrc',
                    reporter: 'checkstyle',
                    reporterOutput: 'checkstyle-result.xml'
                },
                src: ['lib/**/*.js', 'test/**/*.js', 'bin/*']
            },
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            bin: {
                files: '<%= jshint.bin.src %>',
                tasks: ['jshint:bin']
            },
            lib: {
                files: '<%= jshint.lib.src %>',
                tasks: ['jshint:lib', 'mochaTest:test', 'mochaTest:coverage']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test', 'mochaTest:test', 'mochaTest:coverage']
            },
        },
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-blanket');
    grunt.loadNpmTasks('grunt-notify');
    // Default task.
    grunt.registerTask('default', ['jshint:gruntfile', 'jshint:bin', 'jshint:lib', 'jshint:test', 'mochaTest:test', 'mochaTest:coverage']);

    grunt.registerTask('jenkins', ['mochaTest:jenkinsCount', 'mochaTest:jenkinsCov', 'jshint:jenkins']);
};
