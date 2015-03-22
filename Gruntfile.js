module.exports = function(grunt) {
    grunt.initConfig({
        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },
        // compress js.
        uglify: {
            options: {
                sourceMap: true,
                mangle: {
                    except: ['window.Dispatcher', 'Q']
                }
            },
            my_target: {
                files: {
                    'dist/dispatcher.min.js': ['src/js/dispatcher.js', 'src/js/ExecutionContext.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

   grunt.registerTask('default', ['uglify']);
};


