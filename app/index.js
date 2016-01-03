require('array.prototype.find')
var generators = require('yeoman-generator')
var path       = require('path')
var camelize   = require('camelize')
var compact    = require('lodash.compact')
var assign     = require('lodash.assign')
var prefixnote = require('prefixnote')
var chalk      = require('chalk')
var striate    = require('gulp-striate')
var R          = require('ramda')
var fileExists = require('file-exists')
var pkg        = require('../package.json')

// files that should never be copied
var ignore = ['.DS_Store']

// if the package name is generator-yoga then we are in creation mode
// which will recursively copy this generator itself and give it a new
// project name so that subsequent runs will generate from app/templates
var createMode = pkg.name === 'generator-yoga'

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
      this.yogaFile = require(createMode ? '../create/yoga.json' :
        fileExists('./yoga.json') ? './yoga.json' : './yoga.js')
    }
    catch(e) {
      if(e.code === 'MODULE_NOT_FOUND') {
        console.log(chalk.red('No yoga file found. Proceeding with simple copy.'))
      }
      else {
        console.log(chalk.red('Invalid yoga file'))
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

    // set the default project name to the destination folder name
    var projectPrompt = this.yogaFile.prompts.find(R.propEq('name', 'project'))
    if(projectPrompt) {
      projectPrompt.default = path.basename(this.env.cwd)
    }

    this.prompt(this.yogaFile.prompts, function (props) {

      // disallow a project name of generator-yoga
      if(createMode && props.name === 'generator-yoga') {
        var error = 'You may not name your generator "generator-yoga".'
        this.log.error(error)
        done(error)
        return
      }

      // add prompt results to the viewData
      assign(this.viewData, props)

      // format keywords
      this.viewData.keywordsFormatted = props.keywords ? prettyKeywords(props.keywords) : null

      done()
    }.bind(this))
  },

  // Copies all files from the template directory to the destination path
  // parsing filenames using prefixnote and running them through striate
  writing: function () {

    var done = this.async();

    if(createMode) {

      // copy yoga-generator itself
      this.fs.copy(path.join(__dirname, '../'), this.destinationPath(), {
        globOptions: {
          dot: true,
          ignore: [
            '**/.git',
            '**/.git/**/*',
            '**/node_modules',
            '**/node_modules/**/*',
            '**/test/**/*',
            '**/create/**/*'
          ]
        }
      })

      // copy the package.json and README
      this.fs.copyTpl(path.join(__dirname, '../create/{}package.json'), this.destinationPath('package.json'), this.viewData)

      this.fs.copyTpl(path.join(__dirname, '../create/README.md'), this.destinationPath('README.md'), this.viewData)

      done()
    }
    else {
      this.registerTransformStream(striate(this.viewData))

      prefixnote.parseFiles(this.templatePath(), this.viewData)

        // copy each file that is traversed
        .on('data', function (file) {
          var filename = path.basename(file.original)

          // always ignore files like .DS_Store
          if(ignore.indexOf(filename) === -1) {
            var from = file.original
            var to = this.destinationPath(path.relative(this.templatePath(), file.parsed))

            // copy the file with templating
            this.fs.copyTpl(from, to, this.viewData)
          }
        }.bind(this))

        .on('end', done)
        .on('error', done)
    }
  },

  end: function () {
    this.installDependencies()
  }

})
