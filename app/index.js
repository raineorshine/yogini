/*
This is the entrypoint for creating generators with generator-yogini.

For the entrypoint for yogini baby generators, see app/index.js.
*/

const Generator = require('yeoman-generator')
const path = require('path')
const prefixnote = require('prefixnote')
const chalk = require('chalk')

// files that should never be copied
const ignore = ['.DS_Store']

module.exports = class extends Generator {

  constructor(args, opts) {

    super(args, opts)

    this.yoginiFile = this.getYoginiFile()

  }

  /** Try yogini.json or yogini.js, parse, and report error messages if missing/invalid. */
  getYoginiFile() {
    return require('../create/yogini')
  }

  async prompting() {

    // set the default project name to the destination folder name and provide a validation function
    const projectPrompt = this.yoginiFile.prompts.find(prompt => prompt.name === 'project')
    projectPrompt.default = path.basename(this.env.cwd)
    projectPrompt.validate = input =>
      input === 'yogini' ? 'Cannot be named "yogini"' :
      input.indexOf('generator-') !== 0 ? 'Must start with "generator-"' :
      true

    const answers = await this.prompt(this.yoginiFile.prompts)

    this.templateData = {
      ...this.yoginiFile.data,
      ...answers,
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
      this.templateData
    )

    this.fs.copyTpl(
      path.join(__dirname, '../create/README.md'),
      this.destinationPath('README.md'),
      this.templateData
    )

  }

  end() {
    this.npmInstall()
  }

}
