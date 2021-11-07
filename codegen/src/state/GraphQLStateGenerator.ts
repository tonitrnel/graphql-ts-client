/**
 * @author ChenTao
 * 
 * 'graphql-ts-client' is a graphql client for TypeScript, it has two functionalities:
 * 
 * 1. Supports GraphQL queries with strongly typed code
 *
 * 2. Automatically infers the type of the returned data according to the strongly typed query
 */

import { WriteStream } from "fs";
import { GraphQLInterfaceType, GraphQLObjectType, GraphQLSchema, GraphQLUnionType } from "graphql";
import { join } from "path";
import { FetcherContext } from "../FetcherContext";
import { closeStream, createStreamAndLog, Generator } from "../Generator";
import { GeneratorConfig } from "../GeneratorConfig";
import { GraphQLStateFetcherWriter } from "./GraphQLStateFetcherWriter";
import { TriggerEventWiter } from "./TriggerEventWriter";
import { TypedConfigurationWriter } from "./TypedConfigurationWriter";

export class GraphQLStateGenerator extends Generator {

    constructor(config: GeneratorConfig) {
        super(config);
    }

    protected writeIndexCode(stream: WriteStream, schema: GraphQLSchema) {
        stream.write(`import { StateManager, makeStateFactory, makeManagedObjectHooks, useStateManager } from 'graphql-state';\n`);
        stream.write(`import type { Schema } from "./TypedConfiguration";\n`);
        stream.write(`export type { Schema } from "./TypedConfiguration";\n`);

        super.writeIndexCode(stream, schema);

        stream.write(TYPED_API);
        stream.write(`export { newTypedConfiguration} from "./TypedConfiguration";\n`);
    }

    protected additionalExportedTypeNamesForFetcher(
        modelType: GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType,
        ctx: FetcherContext
    ): ReadonlyArray<string> {
        if (ctx.triggerableTypes.has(modelType)) {
            return [
                ...super.additionalExportedTypeNamesForFetcher(modelType, ctx),
                `${modelType.name}FlatType`
            ];
        }
        return super.additionalExportedTypeNamesForFetcher(modelType, ctx);
    }

    protected createFetchWriter(
        modelType: GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType,
        ctx: FetcherContext,
        stream: WriteStream,
        config: GeneratorConfig
    ): GraphQLStateFetcherWriter {
        return new GraphQLStateFetcherWriter(
            modelType,
            ctx,
            stream,
            config
        );
    }

    protected async generateServices(ctx: FetcherContext, promises: Promise<void>[]) {
        promises.push(this.generateTypedConfiguration(ctx));
        await this.mkdirIfNecessary("triggers");
        promises.push(this.generateTriggerEvents(ctx));
        promises.push(this.generateTriggerIndex(ctx));
    }

    private async generateTypedConfiguration(ctx: FetcherContext) {
        const stream = createStreamAndLog(
            join(this.config.targetDir, "TypedConfiguration.ts")
        );
        new TypedConfigurationWriter(ctx, stream, this.config).write();
        await closeStream(stream);
    }

    private async generateTriggerEvents(ctx: FetcherContext) {
        for (const triggerableType  of ctx.triggerableTypes) {
            const fetcherType = triggerableType as GraphQLObjectType | GraphQLInterfaceType;
            const dir = join(this.config.targetDir, "triggers");
            const stream = createStreamAndLog(join(dir, `${fetcherType.name}ChangeEvent.ts`));
            new TriggerEventWiter(
                fetcherType, 
                ctx.idFieldMap.get(fetcherType), 
                stream, 
                this.config
            ).write();
            await closeStream(stream);
        }
    }

    private async generateTriggerIndex(ctx: FetcherContext) {
        const stream = createStreamAndLog(
            join(
                join(this.config.targetDir, "triggers"), 
                "index.ts"
            )
        );
        for (const triggerableType of ctx.triggerableTypes) {
            const fetcherType = triggerableType as GraphQLObjectType | GraphQLInterfaceType;
            stream.write(`export type { ${
                fetcherType.name
            }EvictEvent, ${
                fetcherType.name
            }ChangeEvent } from './${fetcherType.name}ChangeEvent';\n`);
        }
        await closeStream(stream);
    }
}

const TYPED_API =`
const {
    createState,
    createParameterizedState,
    createComputedState,
    createParameterizedComputedState,
    createAsyncState,
    createParameterizedAsyncState
} = makeStateFactory<Schema>();

export {
    createState,
    createParameterizedState,
    createComputedState,
    createParameterizedComputedState,
    createAsyncState,
    createParameterizedAsyncState
};

const { useObject, useObjects } = makeManagedObjectHooks<Schema>();

export { useObject, useObjects };

export function useTypedStateManager(): StateManager<Schema> {
    return useStateManager<Schema>();
}

`;