const Generator = require('yeoman-generator')
const path = require('path')
const camelize = require('camelize')
const prefixnote = require('prefixnote')
const chalk = require('chalk')
const striate = require('gulp-striate')
const R = require('ramda')
const indent = require('indent-string')
const pkg = require('../package.json')

// files that should never be copied
const ignore = ['.DS_Store']

// parse an array from a string
const parseArray = str =>
  R.filter(R.identity, str.split(',').map(R.invoker(0, 'trim')))

// stringify an object and indent everything after the opening line
const stringifyIndented = (value, chr, n) =>
  indent(JSON.stringify(value, null, n), chr, n).slice(chr.length * n)

module.exports = class extends Generator {

  constructor(args, opts) {

    super(args, opts)

    this.option('test')

    // if the package name is yogini then we are in creation mode
    // which will recursively copy this generator itself and give it a new
    // project name so that subsequent runs will generate from app/templates
    this.createMode = !this.options.test && pkg.name === 'generator-yogini'

    // parse yogini.json and report error messages for missing/invalid
    try {
      if (this.createMode) {
        this.yoginiFile = require('../create/yogini.json')
      }
      else if (this.options.test) {
        this.yoginiFile = require('../test/testapp/yogini.json')
      }
      else {
        try {
          this.yoginiFile = require('./yogini.json')
        }
        catch (e) {
          if (e.code !== 'MODULE_NOT_FOUND') {
            this.yoginiFile = require('./yogini.js')
          }
          else {
            throw e
          }
        }
      }
    }
    catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.warn(chalk.yellow('No yogini file found. Proceeding with simple copy.'))
      }
      else {
        console.error(chalk.red('Invalid yogini file'))
        console.error(chalk.red(e))
      }
    }

  }

  async prompting() {

    if (this.yoginiFile && !(this.yoginiFile.prompts && this.yoginiFile.prompts.length)) {
      console.warn(chalk.yellow('No prompts in yogini.json. Proceeding with simple copy.'))
      return
    }

    // set the default project name to the destination folder name and provide a validation function
    if (this.createMode) {
      const projectPrompt = this.yoginiFile.prompts.find(R.propEq('name', 'project'))
      projectPrompt.default = path.basename(this.env.cwd)
      projectPrompt.validate = input =>
        input === 'yogini' ? 'Cannot be named "yogini"' :
        input.indexOf('generator-') !== 0 ? 'Must start with "generator-"' :
        true
    }

    const props = await this.prompt(this.yoginiFile.prompts)

    // populate viewData from the prompts and formatted values
    this.viewData = R.merge(props, {
      camelize: camelize,
      keywordsFormatted: props.keywords ? stringifyIndented(parseArray(props.keywords), ' ', 2) : ''
    })
  }

  // Copies all files from the template directory to the destination path
  // parsing filenames using prefixnote and running them through striate
  writing() {

    if (this.createMode) {

      // copy yogini-generator itself
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
      this.fs.copyTpl(
        path.join(__dirname, '../create/{}package.json'),
        this.destinationPath('package.json'),
        this.viewData
      )

      this.fs.copyTpl(
        path.join(__dirname, '../create/README.md'),
        this.destinationPath('README.md'),
        this.viewData
      )
    }
    else {

      const done = this.async()

      this.registerTransformStream(striate(this.viewData))

      prefixnote.parseFiles(this.templatePath(), this.viewData)

        // copy each file that is traversed
        .on('data', file => {
          const filename = path.basename(file.original)

          // always ignore files like .DS_Store
          if (ignore.indexOf(filename) === -1) {
            const from = file.original
            const to = this.destinationPath(path.relative(this.templatePath(), file.parsed))

            // copy the file with templating
            this.fs.copyTpl(from, to, this.viewData)
          }
        })

        .on('end', done)
        .on('error', done)
    }
  }

  end() {
    this.npmInstall()
  }

}
