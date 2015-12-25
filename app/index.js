var generators = require('yeoman-generator')
var path       = require('path')
var camelize   = require('camelize')
var yosay      = require('yosay')
var compact    = require('lodash.compact')
var extend     = require('lodash.assign')
var prefixnote = require('prefixnote')

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

    this.yogaFile = require('./yoga.json')
    this.camelize = camelize

  },

  prompting: function () {

    var done = this.async();

    // Have Yeoman greet the user.
    // this.log(yosay('Welcome to Raine\'s marveous npm module generator!'));

    this.prompt(this.yogaFile.prompts, function (props) {

      // assign each prop to the generator instance for use in templating
      extend(this, props)
      this.props = props

      // disable prettyKeywords until I can figure out how to keep yeoman from html-escaping quotes
      if(this.keywords) {
        this.keywords = prettyKeywords(this.keywords)
      }

      done()
    }.bind(this))
  },

  // Copies all files from the template directory to the destination path
  // parsing filenames using prefixnote and running them through striate
  writing: function () {

    var done = this.async();

    prefixnote.parseFiles(this.templatePath(), this.props)
      .on('data', function (file) {
        var from = file.original
        var to = this.destinationPath(path.relative(this.templatePath(), file.parsed))
        this.fs.copyTpl(from, to, this)
      }.bind(this))
      .on('end', done)
      .on('error', done)
  },

  end: function () {
    this.installDependencies()
  }

})
