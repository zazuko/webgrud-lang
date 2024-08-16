import type { WebGrudDefinitionsServices } from './web-grud-definitions-module.js';
import type { AstNode, AstNodeDescription, LangiumDocument, PrecomputedScopes } from 'langium';
import type { Model, Cube } from './generated/ast.js';
import { isSourcedValue } from './generated/ast.js';
import { Cancellation, DefaultScopeComputation, interruptAndCheck, MultiMap } from 'langium';

export class WebGrudDefinitionsScopeComputation extends DefaultScopeComputation {

    constructor(services: WebGrudDefinitionsServices) {
        super(services);
    }

    override async computeLocalScopes(document: LangiumDocument, cancelToken = Cancellation.CancellationToken.None): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Model;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        const cube2DimensionDescriptionsDict = new MultiMap<Cube, AstNodeDescription>();

        for (const factor of model.factors) {
            await interruptAndCheck(cancelToken);

            if (factor.cube?.ref) {
                const cube = factor.cube.ref;
                let descriptions;
                if (cube2DimensionDescriptionsDict.has(cube)) {
                    descriptions = cube2DimensionDescriptionsDict.get(cube);
                } else {
                    descriptions = await this.buildDescriptionsForDimensions(cube, document, cancelToken);
                    cube2DimensionDescriptionsDict.addAll(cube, descriptions);
                }
                
                scopes.addAll(factor, descriptions);
            }
        }

        for (const sourcedValue of model.values.filter(isSourcedValue)) {
            await interruptAndCheck(cancelToken);

            if (isSourcedValue(sourcedValue) && sourcedValue.cube?.ref) {
                const cube = sourcedValue.cube.ref;
                let descriptions;
                if (cube2DimensionDescriptionsDict.has(cube)) {
                    descriptions = cube2DimensionDescriptionsDict.get(cube);
                } else {
                    descriptions = await this.buildDescriptionsForDimensions(cube, document, cancelToken);
                    cube2DimensionDescriptionsDict.addAll(cube, descriptions);
                }
                
                scopes.addAll(sourcedValue, descriptions);
            }
        }
        
        return scopes;
    }

    protected async buildDescriptionsForDimensions(cube: Cube, document: LangiumDocument, cancelToken: Cancellation.CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        if (cube) {
            for (const dimension of cube.dimensions) {
                await interruptAndCheck(cancelToken);

                const description = this.descriptions.createDescription(dimension, dimension.name, document);
                localDescriptions.push(description);
            }
        }

        return localDescriptions;
    }

}