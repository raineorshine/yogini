# yogini
[![npm version](https://img.shields.io/npm/v/generator-yogini.svg)](https://npmjs.org/package/generator-yogini)

**yogini** is a prompt-driven scaffolding system. It makes it easy to create and maintain personal boilerplates that evolve over time.

What makes **yogini** different?

- Prompt-driven (via [Inquirer](https://github.com/SBoudrias/Inquirer.js)) with [easy prompt configuration](https://github.com/raineorshine/yogini/blob/master/app/yogini.json)
- Embedded file-copying logic, e.g. `{useSass}main.scss`
- Templating with [striate](https://github.com/raineorshine/striate), a superset of [ejs](https://github.com/mde/ejs) with better handling of multi-line blocks

Generators created by yogini are [yeoman](http://yeoman.io/) generators, so they can be published and consumed them like any other yeoman generator. You do not need to understand yeoman to use yogini.

## Install

```sh
npm install -g yo                 # install yeoman
npm install -g generator-yogini   # install yogini
```

## Quick Start

### 1. Create your generator

```sh
mkdir generator-mygen             # create a directory for your new generator
cd generator-mygen            
yo yogini                         # generate a blank yogini generator
npm link                          # alias your generator to your globally
                                  # installed npm modules so that you can run
                                  # it with yeoman.
```

### 2. Use your generator

```sh
mkdir mygen1                      # create a directory for your new project
cd mygen1
yo mygen                          # generate a new project
```

## Architecture

Would you like some generator with your generator? I know, it's a bit confusing. There are four levels to be aware of:

- **yo** - Ye ol' scaffolding framework. Does all the hard work, like a good yeoman. Kind of a pain to work with as a developer.
- **yogini** - Ye fancy `yo` wrapper that makes it easier to create, evolve, and maintain your generator.
- **generator-mygen** - Your personal generator. Name it whatever you want. Typically you'll have a single generator and use its powerful conditional prompts to control which files are copied for the desired project type.
- **mygen1** - A cute little offspring from `generator-mygen`. A fresh, new project!

## Building your generator

An initial **yogini** generator produces only a blank README, so you have to customize it to generate something useful.

- Drop files into `app/templates`. All files from this directory will be copied into your project directory when you run the generator.
- Edit the [Inquirer](https://github.com/SBoudrias/Inquirer.js) prompts in `app/yogini.json`. These will determine which files get copied (via [prefixnotes](https://github.com/raineorshine/prefixnote)) and what code gets copied (via [striate](https://github.com/raineorshine/striate)).

Sample yogini.json file:

```js
{
  "prompts": [
    {
      "type": "confirm",
      "name": "js",
      "message": "Does your project use Javascript?",
      "store": true
    },
    {
      "type": "confirm",
      "name": "css",
      "message": "Does your project use css?",
      "store": true
    }
  }
}
```

The above yogini.json file would prompt you with two questions every time you run your generator and store the answers in `js` and `css` variables. These variables drive the main two aspects of scaffolding: file copying and templating.

### 1. File Copying

You can control which files in `/app/templates` get copied into your new project by prefixing filenames with expressions that include prompt variables.

```
.
├── index.html
├── {js}scripts
│   └── main.js
└── {css}styles
    └── main.css
```

In the above example, the scripts folder will only be copied if `js` (as declared in yogini.json) is true, and the `styles` folder will only be copied if `css` is true.

- Empty expressions are a great way to include system and hidden files in your templates folder without them having an effect until they are copied:
  - `{}package.json`
  - `{}.gitignore`
- If a folder name only consists of an expression, all files will be copied to the parent folder:

  ```sh
  main.js
  {js}
    ├── 1.js
    ├── 2.js
    └── 3.js
  ```

  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;⇨

  ```sh
  main.js
  1.js
  2.js
  3.js
  ```

- Expressions can be any Javascript expression that evaluates to `boolean`:

  ```sh
  {js && gulp}gulpfile.js
  ```

See [prefixnote](https://github.com/raineorshine/prefixnote) for the nitty-gritty.


### 2. Templating

You can use [striate](https://github.com/raineorshine/striate), a superset of [ejs](https://github.com/mde/ejs), to control which code gets generated within the files. The answers given to the prompts in yogini.json are available as variables within the scope of your template files.

```html
<!DOCTYPE html>
<html>
<head>
  >> if(css) {
  <link rel='Stylesheet' type='text/css' href='styles/main.css'>
  >> }
</head>
<body>
  >> if(js) {
  <script src='scripts/main.js'></script>
  >> }
</body>
</html>
```

You can see a complete yogini generator with prompts, file prefixes, and templating at [generator-yogini-sample](https://github.com/raineorshine/generator-yogini-sample).

## License

ISC © [Raine Revere](https://github.com/raineorshine)
