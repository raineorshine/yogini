/*
This is the entrypoint for yogini baby generators. Like a baby consuming its mother... or something.

For the entrypoint for running yogini itself as a generator (making babies), see app/index.js.
*/

const Generator = require('yeoman-generator')
const path = require('path')
const prefixnote = require('prefixnote')
const chalk = require('chalk')
const striate = require('gulp-striate')
const once = require('once')

// files that should never be copied
const ignore = ['.DS_Store']

const id = x => x

// pass the directory of the caller so that we can look for the yogini file
// cannot infer caller via require stack trace due to yeoman loader
module.exports = dirname => {

  const Yogini = class extends Generator {

    constructor(args, opts) {

      super(args, opts)

      this.yoginiFile = this.getYoginiFile()

    }

    /** Try loading the yogini file from various locations, parse, and report error messages if missing/invalid. */
    getYoginiFile() {

      let yoginiFile // eslint-disable-line fp/no-let

      try {
        yoginiFile = require(path.resolve(dirname, 'yogini'))
      }
      catch (e) {
        this.env.error(chalk.red(e))
      }

      return yoginiFile
    }

    async prompting() {

      if (!this.yoginiFile) return

      if (!this.yoginiFile.prompts?.length) {
        this.log(chalk.yellow('No prompts in yogini.json. Proceeding with simple copy.'))
        return
      }

      const answers = await this.prompt(this.yoginiFile.prompts)

      this.templateData = {
        ...this.yoginiFile.data,
        ...(this.yoginiFile.parse ?? id)(answers),
      }
    }

    // Copies all files from the template directory to the destination path
    // parsing filenames using prefixnote and running them through striate
    writing() {

      const doneOnce = once(this.async())

      this.registerTransformStream(striate(this.templateData))

      prefixnote.parseFiles(this.templatePath(), this.templateData)

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
              this.fs.copyTpl(from, to, this.templateData)
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

  return Yogini

}
