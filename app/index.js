require('array.prototype.find')
var generators = require('yeoman-generator')
var path       = require('path')
var camelize   = require('camelize')
var prefixnote = require('prefixnote')
var chalk      = require('chalk')
var striate    = require('gulp-striate')
var R          = require('ramda')
var indent     = require('indent-string')
var pkg        = require('../package.json')

// files that should never be copied
var ignore = ['.DS_Store']

// parse an array from a string
function parseArray(str) {
  return R.filter(R.identity, str.split(',').map(R.invoker(0, 'trim')))
}

// stringify an object and indent everything after the opening line
function stringifyIndented(value, chr, n) {
  return indent(JSON.stringify(value, null, n), chr, n).slice(chr.length * n)
}

module.exports = generators.Base.extend({

  constructor: function () {

    generators.Base.apply(this, arguments)

    this.option('test')

    // if the package name is generator-yoga then we are in creation mode
    // which will recursively copy this generator itself and give it a new
    // project name so that subsequent runs will generate from app/templates
    this.createMode = !this.options.test && pkg.name === 'generator-yoga'

    // parse yoga.json and report error messages for missing/invalid
    try {
      if(this.createMode) {
        this.yogaFile = require('../create/yoga.json')
      }
      else if(this.options.test) {
        this.yogaFile = require('../test/testapp/yoga.json')
      }
      else {
        try {
          this.yogaFile = require('./yoga.json')
        }
        catch(e) {
          if(e.code !== 'MODULE_NOT_FOUND') {
            this.yogaFile = require('./yoga.js')
          }
          else {
            throw e
          }
        }
      }
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
      if(this.createMode && props.name === 'generator-yoga') {
        var error = 'You may not name your generator "generator-yoga".'
        this.log.error(error)
        done(error)
        return
      }

      // populate viewData from the prompts and formatted values
      this.viewData = R.merge(props, {
        camelize: camelize,
        keywordsFormatted: props.keywords ? stringifyIndented(parseArray(props.keywords), ' ', 2) : ''
      })

      done()
    }.bind(this))
  },

  // Copies all files from the template directory to the destination path
  // parsing filenames using prefixnote and running them through striate
  writing: function () {

    var done = this.async();

    if(this.createMode) {

      // copy yoga-generator itself
      this.fs.copy(path.join(__dirname, '../'), this.destinationPath(), {
        globOptions: {
          dot: true,
          ignore: [
            '**/.DS_Store',
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
