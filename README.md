# webgrud-lang

A DSL for some parts of [WebGRUD fertilization rule definitions](https://github.com/zazuko/webgrud-app/tree/master/rules). Generates [N3](https://w3c.github.io/N3/spec/). Built with [Langium](https://langium.org/) .

## Contents
```
.
├── generated  ----------------------------------< Generated N3 rules for sample model
│   └── fertilizationN.n3
│
├── grud-def  -----------------------------------< The Langium project
│   └── src
│       ├── cli
│       │   └── generator.ts  -------------------< Generator for N3 rules
│       └── language
│           └── web-grud-definitions.langium  ---< Grammar definition
│
└── sample-model  -------------------------------< Sample model of WebGRUD definitions
    └── fertilizationN.grud
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

### Using the editor in the browser

Start the dev web server (inside *./grud-def*):

```
$ npm run serve
```

### Using the CLI

Generate N3 rules from file *fertilizationN.grud* :

```
$ node grud-def/bin/cli.js generate -r sample-model sample-model/fertilizationN.grud
N3 rules generated successfully: generated/fertilizationN.n3
```
