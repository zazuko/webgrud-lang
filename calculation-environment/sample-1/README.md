
# Running the calculation 

1) Generate *rules/fertilizationN.n3*
2) Run the calculation with `eye` reasoner (docker image [zazukoians/node-java-jena](https://hub.docker.com/r/zazukoians/node-java-jena) has all the necessary tools)

```sh
$ ./update-fertilizationN-rules.sh; docker run --rm -it -v $(pwd):/app zazukoians/node-java-jena:v5 ./run.sh
```

The output of the calculation is in the file `result.ttl`.


# Visualizing the result

Using https://giacomociti.github.io/rdf2dot/

- Paste the content of `result.ttl`
- Use custom rules: [visualization.n3](https://github.com/zazuko/webgrud-app/blob/master/examples/visualization.n3)


## Background Info

The request data and tables extract in the *./data* folder were captured from running a calculation in the "webgrud-app"

```
https://webgrud-app.zazukoians.org/test
  calculation: 'fertilization N'
  example:     'N default'
```

The rules in the *./rules* folder are (extracts) from https://github.com/zazuko/webgrud-app/tree/master/rules