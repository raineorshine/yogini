/*
This is the entrypoint for yogini baby generators. Like a baby consuming its mother... or something.

For the entrypoint for running yogini itself as a generator (making babies), see app/index.js.
*/

const Generator = require('yeoman-generator')
const path = require('path')
const camelize = require('camelize')
const prefixnote = require('prefixnote')
const chalk = require('chalk')
const striate = require('gulp-striate')
const R = require('ramda')
const indent = require('indent-string')
const once = require('once')

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

    this.yoginiFile = this.getYoginiFile()

  }

  /** Try loading the yogini file from various locations, parse, and report error messages if missing/invalid. */
  getYoginiFile() {

    let yoginiFile // eslint-disable-line fp/no-let

    try {
      try {
        yoginiFile = this.options.test
          ? require('./test/testapp/yogini.json')
          : require('./app/yogini.json')
      }
      catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          yoginiFile = require('./app/yogini.js')
        }
        else {
          throw e
        }
      }
    }
    catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
      }
      else {
        this.env.error(chalk.red('Invalid yogini file'))
        this.env.error(chalk.red(e))
      }
    }

    return yoginiFile
  }

  async prompting() {

    if (!this.yoginiFile) return

    if (!this.yoginiFile.prompts?.length) {
      this.log(chalk.yellow('No prompts in yogini.json. Proceeding with simple copy.'))
      return
    }

    const props = await this.prompt(this.yoginiFile.prompts)

    // populate viewData from the prompts and formatted values
    this.viewData = {
      ...props,
      camelize,
      keywordsFormatted: props.keywords ? stringifyIndented(parseArray(props.keywords), ' ', 2) : ''
    }
  }

  // Copies all files from the template directory to the destination path
  // parsing filenames using prefixnote and running them through striate
  writing() {

    const doneOnce = once(this.async())

    this.registerTransformStream(striate(this.viewData))

    prefixnote.parseFiles(this.templatePath(), this.viewData)

      // copy each file that is traversed
      .on('data', file => {

        // done may already have been called if there was an error, but parseFiles will keep outputting data. If so, bail.
        if (doneOnce.called) return

        const filename = path.basename(file.original)

        // always ignore files like .DS_Store
        if (ignore.indexOf(filename) === -1) {
          const from = file.original
          const to = this.destinationPath(path.relative(this.templatePath(), file.parsed))

          // copy the file with templating
          try {
            this.fs.copyTpl(from, to, this.viewData)
          }
          catch (e) {
            this.env.error(chalk.red(e))
            doneOnce(e)
          }
        }
      })

      .on('error', doneOnce)
      .on('end', doneOnce)
  }

  end() {
    this.npmInstall()
  }

}
