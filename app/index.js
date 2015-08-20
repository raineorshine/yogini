var generators = require('yeoman-generator')
var glob       = require('glob')
var Promise    = require('bluebird')
var path       = require('path')
var camelize   = require('camelize')
var yosay      = require('yosay')
var parse      = require('esprima').parse
var staticEval = require('static-eval')
var compact    = require('lodash.compact')
var extend     = require('lodash.assign')
var fs         = require('fs')

Promise.promisifyAll(fs)
var globAsync = Promise.promisify(glob)

// capturing groups:
// 1. expression
// 2. rename
// 3. options
// 4. filename
var filenameRegex = /^(?:{(.*?)(?::(.*?))?(?:\|(.*?)?)?})?(.*?)$/

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

function parseFilename(filename) {
  var matches = filenameRegex.exec(filename)
  return {
    raw:        filename,
    expression: matches[1],
    rename:     matches[2],
    options:    matches[3],
    filename:   matches[4]
  }
}

function getNewName(fileInfo) {
  return fileInfo.rename || fileInfo.filename
}

function evaluate(fileInfo, data) {
  if(!fileInfo.expression) { return true }
  var ast = parse(fileInfo.expression).body[0].expression
  return staticEval(ast, data)
}

module.exports = generators.Base.extend({
  constructor: function () {

    generators.Base.apply(this, arguments)

    this.yogaFile = require('./yoga.json')
    this.camelize = camelize

  },

  init: function () {

    var that = this

    this.glob = function(dirname, newDirname, data) {

      if(arguments.length === 2) {
        data = arguments[1]
        newDirname = dirname
      }

      // get all files in the given folder
      return fs.readdirAsync(dirname)
        .map(function (filename) {
          var filePath = path.join(dirname, filename)
          var fileInfo = parseFilename(filename)

          // evaluate the filename DSL expression
          return evaluate(fileInfo, data) ?
            fs.statAsync(filePath).then(function (stat) {

              // generate the destination path
              var newName = getNewName(fileInfo)
              var newPath = path.join(newDirname, newName)
              var newDestinationPath = that.destinationPath(path.relative(that.templatePath(), newPath))

              return stat.isFile() ?
                that.copy(filePath, newDestinationPath) : // if it's a file, copy it
                that.glob(filePath, path.join(newDirname, newName), data)   // if it's a directory, RECURSE
            }) :
            null
        })
    }


  },

  prompting: function () {

    var done = this.async();

    // Have Yeoman greet the user.
    // this.log(yosay('Welcome to Raine\'s marveous npm module generator!'));

    this.prompt(this.yogaFile.prompts, function (props) {

      // assign each prop to the generator instance for use in templating
      extend(this, props)
      this.props = props
      if(this.keywords) {
        this.keywords = prettyKeywords(this.keywords)
      }

      done()
    }.bind(this))
  },

  writing: function () {

    var done = this.async();

    this.glob(this.templatePath(), this.props)
      .then(done.bind(null, null))
      .catch(done)
  }

})
