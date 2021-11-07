import prompts from 'prompts';
import fs from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const ROOT_DIR = process.cwd();

async function checkReinitialize(){
  if(existsSync(join(ROOT_DIR, 'graphql-ts-client.yml'))) {
    const { reinitialize } = await prompts({
      type: 'confirm',
      name: 'reinitialize',
      message: 'A graphql-ts-client.yml file already exists. Do you want to reinitialize?',
      initial: true,
    });
    if(!reinitialize) {
      process.exit(0);
    }
  }
}

export async function main() {
  await checkReinitialize()
  const { generator, schema, targetDir } = await prompts([
    {
      type: 'select',
      message: 'select a generator',
      name: 'generator',
      choices: [
        { title: 'AsyncGenerator', value: 'AsyncGenerator' },
        { title: 'ApolloGenerator', value: 'ApolloGenerator' },
        { title: 'RelayGenerator', value: 'RelayGenerator' },
        { title: 'GraphQLStateGenerator', value: 'GraphQLStateGenerator' },
      ],
    },
    {
      type: 'text',
      message: 'select schema source',
      name: 'schema',
    },
    {
      type: 'text',
      message: 'Input output path',
      name: 'targetDir',
      initial: './src/__generated',
      validate: (value) => (value.startsWith('./') ? true : 'Invalid path'),
    }
  ]);
  await fs.writeFile(
    join(ROOT_DIR, 'graphql-ts-client.yml'),
    // prettier-ignore
    [
      `generator: "${generator}"`,
      `schema: "${schema}"`,
      `targetDir: "${targetDir}"`
    ].join('\n')
  );
}
