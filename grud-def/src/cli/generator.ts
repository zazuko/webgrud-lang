import type { Model, ValueDefinition, SourcedValue, SumValue, ConditionalValue } from '../language/generated/ast.js';
import { isValueDefinition, isSourcedValue, isSumValue, isConditionalValue, isStringEqualityCondition } from '../language/generated/ast.js';
import { type Generated, expandToNode, joinToNode, toString } from 'langium/generate';
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

        ${joinToNode(model.values.filter(isValueDefinition), generateValueDefinition, { appendNewLineIfNotEmpty: true })}

    `;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function generateValueDefinition(value: ValueDefinition): Generated {
    let antecedent, consequent;
    if (isSourcedValue(value.value)) {
        antecedent = generateSourcedValueAntecedent(value.value, value.name)
        consequent = generateSourcedValueConsequent(value.value, value.name)
        // todo maybeDefaultValue
    }
    else if (isSumValue(value.value)) { 
        antecedent = ''
        consequent = generateSumValue(value.value, value.name)
    }
    else if (isConditionalValue(value.value)) {

    }

    return expandToNode`
    {
       ${antecedent}
    }
    =>
    {
        ${consequent}
    } .
    `.appendNewLineIfNotEmpty()
        .appendNewLine();
}

function generateSumValue(sumValue: SumValue, name: string): Generated {
    return expandToNode`
    :${name} a calc:Sum ; 
        calc:summand ${joinToNode(sumValue.summands, summand => `:${summand.ref?.name}`, { separator: ', ' })} ;
    `.appendNewLineIfNotEmpty();
}


function generateSourcedValueAntecedent(sourcedValue: SourcedValue, name: string): Generated {
    return expandToNode`
    <${sourcedValue.cube.ref?.name}/${sourcedValue.cube.ref?.version}> cube:observationSet [ cube:observation ?obs ] .
    ?obs <${sourcedValue.cube.ref?.name}/${sourcedValue.resultDimension.ref?.name}> ?${name} .
    ${joinToNode(sourcedValue.conditions.filter(isStringEqualityCondition),
        condition => `?obs <${sourcedValue.cube.ref?.name}/${condition.dimension.ref?.name}> "${condition.stringValue}" .`)}
        `.appendNewLineIfNotEmpty();
}

function generateSourcedValueConsequent(sourcedValue: SourcedValue, name: string): Generated {
    return expandToNode`
    :${name}
        rdf:value ?${name} ;
        qudt:unit ${sourcedValue.resultDimension.ref?.unit?.ref?.prefixedName} ;
        calc:source ?obs .
    `.appendNewLineIfNotEmpty();
}

// function generateSourcedValue(sourcedValue: SourcedValue): Generated {
//     const maybeDefaultValue = sourcedValue.defaultValue !== undefined ? expandToString`

//         {
//             [] log:notIncludes { <${sourcedValue.cube.ref?.name}/${sourcedValue.cube.ref?.version}> cube:observationSet [] } .
//         }
//         =>
//         {
//             :${sourcedValue.name} rdf:value ${sourcedValue.defaultValue} ;
//                 calc:note "no correction value available" .
//         }
//         .`
//         :'';

//     return expandToNode`
// {
//     <${sourcedValue.cube.ref?.name}/${sourcedValue.cube.ref?.version}> cube:observationSet [ cube:observation ?obs ] .
//     ?obs <${sourcedValue.cube.ref?.name}/${sourcedValue.resultDimension.ref?.name}> ?${sourcedValue.resultDimension.ref?.name} .
//     ${joinToNode(sourcedValue.conditions.filter(isStringEqualityCondition),
//         condition => `?obs <${sourcedValue.cube.ref?.name}/${condition.dimension.ref?.name}> "${condition.stringValue}" .`,
//         { appendNewLineIfNotEmpty: true })}
// }
// =>
// {
//     :${sourcedValue.name}
//         rdf:value ?${sourcedValue.resultDimension.ref?.name} ;
//         qudt:unit ${sourcedValue.resultDimension.ref?.unit?.ref?.prefixedName} ;
//         calc:source ?obs .
// }
// .
// ${maybeDefaultValue}
// `.appendNewLineIfNotEmpty();
// }

// function generateConditionalValue(condValue: ConditionalValue): Generated {
//     return joinToNode(condValue.conditions, generateConditionalBranch, { separator: '\n' });
// }

// function generateConditionalBranch(branch: ConditionalBranch): Generated {
//     const prevConditions = branch.$container.conditions.slice(0, branch.$containerIndex)
//     const notIncludesPrev = (prev: ConditionalBranch) => 
//         `[] log:notIncludes { :${branch.$container.name} calc:condition "${prev.name}" } .`
//     return expandToNode`
//         {
//             ${joinToNode(prevConditions, notIncludesPrev, { separator: ' .\n' })}
//             # TODO actual condition
//         }
//         =>
//         {
//             :${branch.$container.name} 
//                 rdf:value ?${branch.$container.name} ;
//                 calc:condition "${branch.name}" .
//         } .
//     `.appendNewLineIfNotEmpty();
// }