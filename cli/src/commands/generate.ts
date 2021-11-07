import fs from 'fs/promises';
import { join } from 'path';
import yaml from 'yaml';
import { existsSync } from 'fs';
import * as codegen  from 'graphql-ts-client-codegen';
import type {GeneratorConfig} from 'graphql-ts-client-codegen'

const ROOT_DIR = process.cwd();

interface ConfigurationFile {
  generator: 'AsyncGenerator' | 'ApolloGenerator' | 'RelayGenerator' | 'GraphQLStateGenerator',
  schema: string,
  targetDir: string,
  indent?: string,
  objectEditable?: boolean
  arrayEditable?: boolean
  fetcherSuffix?: string,
  scalarTypeMap?: {
    [key: string]: 'string' | 'number' | 'boolean'
  }
  idFieldMap?: {
    [key: string]: string
  }
  defaultFetcherExcludeMap?: {
    [key: string]: string[]
  }
  headers?: {
    [key: string]: string
  }
}

async function parseConfig(): Promise<Partial<ConfigurationFile>> {
  // parse JSON extension config file
  if (existsSync(join(ROOT_DIR, 'graphql-ts-client.json'))) {
    try {
      return JSON.parse(await fs.readFile(join(ROOT_DIR, 'graphql-ts-client.json'), 'utf8')) as Partial<GeneratorConfig>;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
  // parse YAML extension config field
  if (existsSync(join(ROOT_DIR, 'graphql-ts-client.yml'))){
    try {
      return yaml.parse(await fs.readFile(join(ROOT_DIR, 'graphql-ts-client.yml'), 'utf8')) as Partial<GeneratorConfig>;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
  throw new Error('No config file found');
}

export async function main() {
  const { generator: generatorName, schema, targetDir, headers = {}, ...config  } = await parseConfig();
  if (!generatorName) throw new Error("Please specify a generator");
  if (!schema) throw new Error("Please specify a schema source");
  if (!targetDir) throw new Error("Please specify a target directory")
  if (!Reflect.has(codegen, generatorName)) throw new Error("The generator is not exists")
  const isHTTP = /^https?:\/\//.test(schema)
  const generator = new codegen[generatorName]({
    schemaLoader: async () => {
      return isHTTP ? codegen.loadRemoteSchema(schema,headers) : codegen.loadLocalSchema(join(ROOT_DIR, schema))
    },
    targetDir: join(ROOT_DIR, targetDir),
    ...config
  })
  await generator.generate()
}