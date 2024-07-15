import type { WebGrudDefinitionsServices } from './web-grud-definitions-module.js';
import type { AstNode, AstNodeDescription, LangiumDocument, PrecomputedScopes } from 'langium';
import type { Model, Factor } from './generated/ast.js';
import { Cancellation, DefaultScopeComputation, interruptAndCheck, MultiMap } from 'langium';

export class WebGrudDefinitionsScopeComputation extends DefaultScopeComputation {

    constructor(services: WebGrudDefinitionsServices) {
        super(services);
    }

    override async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Model;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();

        for (const factor of model.factors) {
            await interruptAndCheck(cancelToken);
            await this.includeDimensionsInScope(factor, scopes, document, cancelToken);
        }
        
        return scopes;
    }

    protected async includeDimensionsInScope(factor: Factor, scopes: PrecomputedScopes, document: LangiumDocument, cancelToken: Cancellation.CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        if (factor.cube?.ref) {            
            for (const dimension of factor.cube.ref.dimensions) {
                await interruptAndCheck(cancelToken);
                const description = this.descriptions.createDescription(dimension, dimension.name, document);
                localDescriptions.push(description);
            }
            scopes.addAll(factor, localDescriptions);            
        }

        return localDescriptions;
    }

}