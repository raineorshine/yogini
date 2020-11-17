module.exports = {

  parse: answers => ({
    ...answers,
    bar: answers.foo + 'bar'
  }),

  prompts: [
    {
      type: 'text',
      name: 'foo',
      message: 'foo'
    }
  ]
}
