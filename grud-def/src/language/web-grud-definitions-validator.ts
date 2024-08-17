import { MultiMap, type ValidationAcceptor, type ValidationChecks } from 'langium';
import { type WebGrudDefinitionsAstType, type Unit, type SumValue, isConditionalValue, isValue, Model, ValueDefinition, Literal, SourcedValue, ValueReference } from './generated/ast.js';
import type { WebGrudDefinitionsServices } from './web-grud-definitions-module.js';
import { match } from 'ts-pattern';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: WebGrudDefinitionsServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.WebGrudDefinitionsValidator;
    const checks: ValidationChecks<WebGrudDefinitionsAstType> = {
        Unit: validator.checkUnitStartsWithCapital,
        Model: validator.checkUnitConsistency
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */

function getUnitsFromValueDefinition (def: ValueDefinition): Unit[] {
    if(isConditionalValue(def)) {
        return def.conditions.flatMap(condition => {
            return match(condition.value)
                .with({ $type: 'SourcedValue' }, getUnitsFromSourcedValue)
                .with({ $type: 'SumValue' }, getUnitsFromSumValue)
                .with({ $type: 'ValueReference' }, getUnitsFromValueReference)
                .with({ $type: 'Literal' }, getUnitsFromLiteral)
                .exhaustive()
        })
      }
      if(isValue(def)) {
        return match(def)
            .with({ $type: 'SourcedValue' }, getUnitsFromSourcedValue)
            .with({ $type: 'SumValue' }, getUnitsFromSumValue)
            .with({ $type: 'ValueReference' }, getUnitsFromValueReference)
            .with({ $type: 'Literal' }, getUnitsFromLiteral)
            .exhaustive()
      }
      return []
}

function getUnitsFromSourcedValue (value: SourcedValue): Unit[] {
    const result = value.resultDimension.ref?.unit?.ref 
    return result ? [result] : []
}

function getUnitsFromSumValue (value: SumValue): Unit[] {
    return value.summands.flatMap(summand => summand.ref? getUnitsFromValueDefinition(summand.ref) : [])
}

function getUnitsFromValueReference (value: ValueReference): Unit[] {
    return value.definition.ref? getUnitsFromValueDefinition(value.definition.ref) : [];
}

function getUnitsFromLiteral (value: Literal): Unit[] {
    return []; // no unit information, unless we enrich the grammar to allow (or require?) it
}

export class WebGrudDefinitionsValidator {

    checkUnitStartsWithCapital(unit: Unit, accept: ValidationAcceptor): void {
        if (unit.name) {
            const firstChar = unit.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('error', 'Unit name should start with a capital.', { node: unit, property: 'name' });
            }
        }
    }

    checkUnitConsistency(model: Model, accept: ValidationAcceptor): void {
        // TODO look for cyclic dependencies between value definitions
        // try to associate a unit to each value definition
        const units = new MultiMap<ValueDefinition, Unit>();
        model.values.forEach(value => units.addAll(value, getUnitsFromValueDefinition(value)))
       
        for (const [value, unit] of units.entriesGroupedByKey()) {
            if(unit.length > 1) {
                const msg = `Multiple units (${unit.map(u => u.name).join(', ')}) for a single value definition.`;
                accept('error', msg, { node: value });
            }
        }
    }
}
