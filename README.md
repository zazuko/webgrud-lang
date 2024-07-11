# webgrud-lang

A DSL for some parts of [WebGRUD fertilization rule definitions](https://github.com/zazuko/webgrud-app/tree/master/rules). Generates [N3](https://w3c.github.io/N3/spec/). Built with [Langium](https://langium.org/) .

## Contents
```
.
├── generated  ----------------------------------< Generated N3 rules for sample model
│   └── foo.n3
│
├── grud-def  -----------------------------------< The Langium project
│   └── src
│       ├── cli
│       │   └── generator.ts  -------------------< Generator for N3 rules
│       └── language
│           └── web-grud-definitions.langium  ---< Grammar definition
│
└── sample-model  -------------------------------< Sample model of WebGRUD definitions
    └── foo.grud
```

## Building the Langium project

Generating artifacts derived from the grammar after changing the grammar definition (inside *./grud-def*):

```
$ npm run langium:generate
```

Main build (inside *./grud-def*):

```
$ npm run build
```


## Usage

### Using the editor in vscode

* Open the Langium project in vscode: `code ./grud-def/`
* Press `F5` to launch the extension in a new *Extension Development Host* window.
* Open a folder and create or open a file with file extension `.grud`



### Using the CLI

Generate N3 rules from file *foo.grud* :

```
$ node grud-def/bin/cli.js generate sample-model/foo.grud 
N3 rules generated successfully: generated/foo.n3
```
