import type { Model, SourcedValue } from '../language/generated/ast.js';
import { isSourcedValue } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export function generateN3(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.n3`;

    const fileNode = expandToNode`
        @base <https://agriculture.ld.admin.ch/agroscope/> .
        @prefix : <https://agriculture.ld.admin.ch/prif/> .
        @prefix calc: <https://agriculture.ld.admin.ch/prif/calc#> .
        @prefix log: <http://www.w3.org/2000/10/swap/log#> .
        @prefix math: <http://www.w3.org/2000/10/swap/math#> .
        @prefix cube: <https://cube.link/> .
        @prefix qudt: <http://qudt.org/schema/qudt/> .
        @prefix unit: <http://qudt.org/vocab/unit/> .
        @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
        @prefix schema: <http://schema.org/> .
        
        ${joinToNode(model.values.filter(isSourcedValue), generateSourcedValue, { appendNewLineIfNotEmpty: true })}
    `;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function generateSourcedValue(sourcedValue: SourcedValue): string {
    return `
{
    <${sourcedValue.cube.ref?.name}/${sourcedValue.cube.ref?.version}> cube:observationSet [ cube:observation ?obs ] .
    ?obs <${sourcedValue.cube.ref?.name}/${sourcedValue.resultDimension.ref?.name}> ?${sourcedValue.resultDimension.ref?.name} .
}
=>
{
    :${sourcedValue.name}
        rdf:value ?${sourcedValue.resultDimension.ref?.name} ;
        qudt:unit ${sourcedValue.resultDimension.ref?.unit?.ref?.prefixedName} ;
        calc:source ?obs .
}
.`;
}