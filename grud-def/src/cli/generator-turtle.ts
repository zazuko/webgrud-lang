import { Condition, Model, ValueDefinition, isCondition, isSourcedValue, isValueDefinition } from '../language/generated/ast.js';
import { type Generated, expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import { match } from 'ts-pattern';

export function generateTTL(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.ttl`;

    const fileNode = expandToNode`
        @base <https://agriculture.ld.admin.ch/agroscope/> .
        @prefix : <https://agriculture.ld.admin.ch/prif/> .
        @prefix sh: <http://www.w3.org/ns/shacl#> .

        ${joinToNode(model.values.filter(isValueDefinition), generateValueDefinition, { appendNewLineIfNotEmpty: true })}

    `;


    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

function generateValueDefinition(value: ValueDefinition): Generated {
    if (!isSourcedValue(value)) {
        return ''
    }

      // </table/PRIFm8t21> </api/schema/parameters> [
        //     sh:property [ sh:name <https://agriculture.ld.admin.ch/agroscope/PRIFm8t21/crop> ; sh:path :crop ] ;
        //     sh:property [ sh:name <https://agriculture.ld.admin.ch/agroscope/PRIFm8t21/nutrient> ; sh:path :nutrient ]
        // ] . 

    return expandToNode`</table/${value.cube.ref?.name}> </api/schema/parameters> [
        ${joinToNode(value.conditions.filter(isCondition), generateSourcedCondition, { separator: '\n' })}	
    ] .`
}

function generateSourcedCondition(condition: Condition): Generated {
    const path = match(condition)
    .with({ $type: 'StringEqualityCondition' }, condition => `"${condition.stringValue}"`)
    .with({ $type: 'NutrientEqualityCondition' }, condition => `<${condition.nutrient.ref?.name}>`)
    .with({ $type: 'InputEqualityCondition' }, condition => `:${condition.inputParameter.ref?.name}`)
    .exhaustive();
    return expandToNode`sh:property [ sh:name <${condition.$container.cube.ref?.name}/${condition.dimension.ref?.name}> ; sh:path ${path} ] ;`
}