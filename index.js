const Generator = require('yeoman-generator')
const path = require('path')
const prefixnote = require('prefixnote')
const chalk = require('chalk')
const striate = require('gulp-striate')
const once = require('once')

// files that should never be copied
const ignore = ['.DS_Store']

module.exports = config => {

  const Yogini = class extends Generator {

    async prompting() {

      if (!config) return

      // accept an array of prompts or a function that returns an array of prompts
      const prompts = typeof config.prompts === 'function'
        ? config.prompts(this)
        : config.prompts

      if (!prompts && prompts.length) {
        this.log(chalk.yellow('No prompts in config. Proceeding with simple copy.'))
        return
      }

      const answers = await this.prompt(prompts)

      // transform the answers with the parse function if it exists
      // otherwise add to this.templateData as-is
      this.templateData = config.parse ? config.parse(answers) : answers
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
