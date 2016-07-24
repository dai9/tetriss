module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

  grunt.initConfig({
    watch: {
      default: {
        files: ["./public/js/script.js"],
        tasks: ['babel']
      }
    },
    "babel": {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        files: {
          "./public/js/trans-script.js": "./public/js/script.js"
        }
      }
    }
  });
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.registerTask("default", ["babel"]);
};
