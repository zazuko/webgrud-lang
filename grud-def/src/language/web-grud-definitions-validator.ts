import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { WebGrudDefinitionsAstType, Unit } from './generated/ast.js';
import type { WebGrudDefinitionsServices } from './web-grud-definitions-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: WebGrudDefinitionsServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.WebGrudDefinitionsValidator;
    const checks: ValidationChecks<WebGrudDefinitionsAstType> = {
        Unit: validator.checkUnitStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class WebGrudDefinitionsValidator {

    checkUnitStartsWithCapital(unit: Unit, accept: ValidationAcceptor): void {
        if (unit.name) {
            const firstChar = unit.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: unit, property: 'name' });
            }
        }
    }

}
