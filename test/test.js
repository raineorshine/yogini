var helpers = require('yeoman-test')
var path = require('path')
var assert = require('yeoman-assert')

describe('yoga', function () {
  describe('create mode', function () {

    before(function (done) {
      helpers.run(path.join(__dirname, '../app'))
        .withPrompts({
          project: 'myproject',
          description: 'mydescription',
          username: 'metaraine',
          license: 'ISC'
        })
        .on('end', done)
    })

    it('copies all the files', function () {
      assert.file([
        '.editorconfig',
        '.gitignore',
        '.gitattributes',
        'package.json',
        'README.md',
        'app',
        'app/index.js',
        'app/yoga.json',
        'app/templates/README.md'
      ])
    })

    it('copies the README', function () {
      assert.fileContent('README.md', 'A fresh generator!\n\n*Created by [yoga](https://github.com/metaraine/generator-yoga)*')
    })

    it('copies the package.json and populates it with the prompt values', function() {
      assert.fileContent('package.json', '"name": "myproject"')
      assert.fileContent('package.json', '"description": "mydescription"')
      assert.fileContent('package.json', '"author": "metaraine"')
      assert.fileContent('package.json', '"license": "ISC"')
    })

  })
})
