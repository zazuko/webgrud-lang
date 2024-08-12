import { Model, ValueDefinition, SourcedValue, SumValue, ConditionalBranch, Value, ValueOrLiteral, ComparisonOperator } from '../language/generated/ast.js';
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

const createRule = (antecedent: Generated, consequent: Generated) => expandToNode`
{
    ${antecedent}
}
=>
{
    ${consequent}
} .
`.appendNewLineIfNotEmpty();

function generateValueDefinition(value: ValueDefinition): Generated {
    if (isSourcedValue(value.value)) {
        return createRule(
            generateSourcedValueAntecedent(value.value, value.name),
            generateSourcedValueConsequent(value.value, value.name))
        // todo maybeDefaultValue
    }
    if (isSumValue(value.value)) { 
        return createRule(
            generateSumValueAntecedent(value.value, value.name),
            generateSumValueConsequent(value.value, value.name))
    }
    if (isConditionalValue(value.value)) {
        return joinToNode(value.value.conditions, generateConditionalBranch, { separator: '\n' })
    }
    if(value.value.definition) {
        return createRule(
            `:${value.value.definition?.ref?.name} rdf:value ?${value.name} .`, 
            `:${value.name} rdf:value ?${value.name} .`)
    }
    if(value.value.numeric) {
        return createRule('', `:${value.name} rdf:value ${value.value.numeric} .`)
    }
    return ''
}

function generateSumValueAntecedent(sumValue: SumValue, name: string): Generated {
    return expandToNode`
    ${joinToNode(sumValue.summands, summand => `
        :${summand.ref?.name} rdf:value ?${summand.ref?.name} .`, { separator: '\n' })}
    (${joinToNode(sumValue.summands, summand => `?${summand.ref?.name} ` )}) math:sum ?${name} .
    `.appendNewLineIfNotEmpty()
}

function generateSumValueConsequent(sumValue: SumValue, name: string): Generated {
    const summands = joinToNode(sumValue.summands, summand => `:${summand.ref?.name}`, { separator: ', ' })
    return expandToNode`
    :${name} rdf:value ?${name} ;
        a calc:Sum ;
        calc:summand ${summands} .
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

function getText(cond:ConditionalBranch): string {
    return cond.comparisons.conjunts.map(c => c.$cstNode?.text).join(' and ')
}

function getN3(valueOrLiteral: ValueOrLiteral) {
    if(valueOrLiteral.value) {
        return `?${valueOrLiteral.value.ref?.name}`
    }
    if (valueOrLiteral.numeric) {
        return valueOrLiteral.numeric
    }
    return ''
}

function getN3Operator(op: ComparisonOperator) {
    if (op.value === '=') {
        return 'math:equalTo'
    }
    if (op.value === '<') {
        return 'math:lessThan'
    }
    return 'math:what'
}

function generateConditionalBranch(branch: ConditionalBranch): Generated {
    const name = branch.$container.$container.name
    const prevConditions = branch.$container.conditions.slice(0, branch.$containerIndex)
    const notIncludesPrev = (prev: ConditionalBranch) => 
        `[] log:notIncludes { :${name} calc:condition "${getText(prev)}" } .`
    const references = branch.comparisons.conjunts.flatMap(x => [ x.left, x.right ]).filter(x => x.value).map(x => x.value?.ref?.name)
    return expandToNode`
        {
            ${joinToNode(prevConditions, notIncludesPrev, { separator: ' .\n' })}
            # ${getText(branch)}
            ${joinToNode(references, name => `:${name} rdf:value ?${name} .`, { separator: '\n' })}
            ${joinToNode(branch.comparisons.conjunts, c => `${getN3(c.left)} ${getN3Operator(c.op)} ${getN3(c.right)} .`, { separator: '\n' })}
            
            ${generateConditionAntecedent(branch.value, name)}
        }
        =>
        {
            :${name} calc:condition "${getText(branch)}" .
            ${generateConditionConsequent(branch.value, name)}
        } .
    `.appendNewLineIfNotEmpty();
}

function generateConditionAntecedent(value: Value, name: string): Generated {
    
    if(isSumValue(value)) {
        return generateSumValueAntecedent(value, name)
    }
    if(isSourcedValue(value)) {
        return generateSourcedValueAntecedent(value, name)
    }
    if(value.definition) {
        const name = value.definition?.ref?.name
        return expandToNode`:${name} rdf:value ?${name} ;`.appendNewLineIfNotEmpty()
    }
    if(value.numeric) {
        return ''
    }
    return ''
}

function generateConditionConsequent(value: Value, name: string): Generated {
    
    if(isSumValue(value)) {
        return generateSumValueConsequent(value, name)
    }
    if(isSourcedValue(value)) {
        return generateSourcedValueConsequent(value, name)
    }
    if(value.definition) {
        return expandToNode`:${name} rdf:value ?${value.definition?.ref?.name} .`
    }
    if(value.numeric) {
        return expandToNode`:${name} rdf:value ${value.numeric} .`
    }
    return ''
}