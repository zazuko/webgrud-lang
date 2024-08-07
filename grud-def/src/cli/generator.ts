import type { Model, SourcedValue } from '../language/generated/ast.js';
import { isSourcedValue, isStringEqualityCondition } from '../language/generated/ast.js';
import { type Generated, expandToNode, joinToNode, toString, expandToString } from 'langium/generate';
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


        {
            ?request a :Request ; :nutrient ?nutrient .
        }
        =>
        {
            ?request :fertilization [
                :nutrient ?nutrient ;
                calc:label "suggested fertilization" ;
                a calc:Sum ;
                calc:summand 
                    :fertilizationNorm, 
                    :correctionTargetYield,
                    :correctionT13,
                    :correctionT15
            ] .
        }
        .


        ### above this line: hardcoded rules that are not yet generated from the model
        ### --------------------------------------------------------------------------
        ### below this line: rules that are generated from the model


        ${joinToNode(model.values.filter(isSourcedValue), generateSourcedValue, { appendNewLineIfNotEmpty: true })}
    `;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function generateSourcedValue(sourcedValue: SourcedValue): Generated {
    const maybeDefaultValue = sourcedValue.defaultValue !== undefined ? expandToString`

        {
            [] log:notIncludes { <${sourcedValue.cube.ref?.name}/${sourcedValue.cube.ref?.version}> cube:observationSet [] } .
        }
        =>
        {
            :${sourcedValue.name} rdf:value ${sourcedValue.defaultValue} ;
                calc:note "no correction value available" .
        }
        .`
        :'';

    return expandToNode`
{
    <${sourcedValue.cube.ref?.name}/${sourcedValue.cube.ref?.version}> cube:observationSet [ cube:observation ?obs ] .
    ?obs <${sourcedValue.cube.ref?.name}/${sourcedValue.resultDimension.ref?.name}> ?${sourcedValue.resultDimension.ref?.name} .
    ${joinToNode(sourcedValue.conditions.filter(isStringEqualityCondition),
        condition => `?obs <${sourcedValue.cube.ref?.name}/${condition.dimension.ref?.name}> "${condition.stringValue}" .`,
        { appendNewLineIfNotEmpty: true })}
}
=>
{
    :${sourcedValue.name}
        rdf:value ?${sourcedValue.resultDimension.ref?.name} ;
        qudt:unit ${sourcedValue.resultDimension.ref?.unit?.ref?.prefixedName} ;
        calc:source ?obs .
}
.
${maybeDefaultValue}
`.appendNewLineIfNotEmpty();
}