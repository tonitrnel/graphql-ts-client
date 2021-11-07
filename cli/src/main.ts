#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import colors from 'chalk';

yargs(hideBin(process.argv))
  .scriptName('graphql-ts-client')
  .usage('$0 <command>')
  .command('init', 'Initial Graphql code Generator', async () => {
    try {
      await import('./commands/init').then((m) => m.main());
      console.log(colors.green("Initial done, see graphql-ts-client.yml!"))
      process.exit(0)
    } catch (e) {
      if (e instanceof Error) {
        console.error(colors.red(`Initial failed: `))
        console.error(colors.red(e.stack))
      }
      process.exit(1)
    }
  })
  .command('generate', 'Generate Graphql code', async () => {
    try {
      await import('./commands/generate').then((m) => m.main());
      console.log(colors.green("Generate done!"));
      process.exit(0)
    } catch (e) {
      if (e instanceof Error) {
        console.error(colors.red(`Generate failed: `))
        console.error(colors.red(e.stack))
      }
      process.exit(1)
    }
  })
  .demandCommand(1)
  .parse();
