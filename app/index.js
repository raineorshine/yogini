/*
This is the entrypoint for creating generators with generator-yogini.

For the entrypoint for yogini baby generators, see app/index.js.
*/

const Generator = require('yeoman-generator')
const path = require('path')
const camelize = require('camelize')
const prefixnote = require('prefixnote')
const chalk = require('chalk')
const R = require('ramda')
const indent = require('indent-string')

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
      yoginiFile = require('../create/yogini.json')
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

    // set the default project name to the destination folder name and provide a validation function
    const projectPrompt = this.yoginiFile.prompts.find(R.propEq('name', 'project'))
    projectPrompt.default = path.basename(this.env.cwd)
    projectPrompt.validate = input =>
      input === 'yogini' ? 'Cannot be named "yogini"' :
      input.indexOf('generator-') !== 0 ? 'Must start with "generator-"' :
      true

    const props = await this.prompt(this.yoginiFile.prompts)

    // populate viewData from the prompts and formatted values
    this.viewData = {
      ...props,
      camelize,
      keywordsFormatted: props.keywords ? stringifyIndented(parseArray(props.keywords), ' ', 2) : ''
    }
  }

  // Copies all files from the template directory to the destination path
  writing() {

    // copy app folder itself
    this.fs.copy(path.join(__dirname, '../app'), this.destinationPath('app'))
    this.fs.copy(path.join(__dirname, '../create/app/index.js'), this.destinationPath('app/index.js'))

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

  end() {
    this.npmInstall()
  }

}
