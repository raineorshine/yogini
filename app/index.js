var generators = require('yeoman-generator')
var path       = require('path')
var camelize   = require('camelize')
var compact    = require('lodash.compact')
var assign     = require('lodash.assign')
var prefixnote = require('prefixnote')
var chalk      = require('chalk')
var striate    = require('gulp-striate')

// prettifies a string of keywords to display each one on a separate line with correct indentation in the package.json
function prettyKeywords(keywords) {

  // convert the keywords string into an array
  keywordArray = compact( // remove empty values
    keywords.split(',')
    .map(function(s) { return s.trim() }) // trim
  );

  // prettify the keywordArray to display each one on a separate line with correct indentation in the package.json
  return JSON.stringify(keywordArray)
    .replace(/([[,])/g, '$1\n    ') // add '    \n' after each item
    .replace(/]/g, '\n  ]') // add a newline before the closing ]
}

module.exports = generators.Base.extend({

  constructor: function () {

    generators.Base.apply(this, arguments)

    // parse yoga.json and report error messages for missing/invalid
    try {
      this.yogaFile = require('./yoga.json')
    }
    catch(e) {
      if(e.code === 'MODULE_NOT_FOUND') {
        console.log(chalk.red('No yoga.json found. Proceeding with simple copy.'))
      }
      else {
        console.log(chalk.red('Invalid yoga.json'))
        console.log(chalk.red(e))
      }
    }

    // this.viewData is passed to copyTpl
    // it is populated with the prompt results during prompting()
    this.viewData = {
      camelize
    }

  },

  prompting: function () {

    var done = this.async();

    if(this.yogaFile && !(this.yogaFile.prompts && this.yogaFile.prompts.length)) {
      console.log(chalk.red('No prompts in yoga.json. Proceeding with simple copy.'))
      return
    }

    this.prompt(this.yogaFile.prompts, function (props) {

      // add prompt results to the viewData
      assign(this.viewData, props)

      // format keywords
      if(props.keywords) {
        this.viewData.keywordsFormatted = prettyKeywords(props.keywords)
      }

      done()
    }.bind(this))
  },

  // Copies all files from the template directory to the destination path
  // parsing filenames using prefixnote and running them through striate
  writing: function () {

    var done = this.async();

    this.registerTransformStream(striate(this.viewData))

    prefixnote.parseFiles(this.templatePath(), this.viewData)
      .on('data', function (file) {
        var from = file.original
        var to = this.destinationPath(path.relative(this.templatePath(), file.parsed))
        this.fs.copyTpl(from, to, this.viewData)
      }.bind(this))
      .on('end', done)
      .on('error', done)
  },

  end: function () {
    this.installDependencies()
  }

})
