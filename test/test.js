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

    it('copies files', function () {
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

    it('copies the package.json and populates it with the prompt values', function() {
      assert.fileContent('package.json', '"name": "myproject"')
      assert.fileContent('package.json', '"description": "mydescription"')
      assert.fileContent('package.json', '"author": "metaraine"')
      assert.fileContent('package.json', '"license": "ISC"')
    })

  })

  describe('test app', function () {

    before(function (done) {
      helpers.run(path.join(__dirname, 'testapp'))
        .withOptions({ test: true })
        .withPrompts({
          project: 'myproject',
          description: 'mydescription',
          striate: true,
          folderIgnore: false,
          folderInclude: true,
          flatten: true
        })
        .on('end', done)
    })

    it('copies files', function () {
      assert.file([
        'README.md'
      ])
    })

    it('copies and properly renames files with empty prefixnote expressions', function () {
      assert.file([
        'empty.txt'
      ])
    })

    it('templates files with ejs', function () {
      assert.fileContent('README.md', '# myproject\n\nmydescription')
    })

    it('templates files with striate', function () {
      assert.fileContent('striate.txt', 'A\nB\nC')
    })

    it('ignores folders with a false prefixnote expression', function () {
      assert.noFile([
        'folderIgnore',
        '{folderIgnore}',
        'folderIgnore/content.txt',
        '{folderIgnore}/content.txt'
      ])
    })

    it('includes folders with a true prefixnote expression', function () {
      assert.file([
        'folderInclude',
        'folderInclude/content.txt'
      ])
    })

    it('copies files of folders with empty names into the parent folder', function () {
      assert.file([
        'flatten.txt'
      ])
      assert.noFile([
        'flatten',
        '{flatten}'
      ])
    })

  })

})
