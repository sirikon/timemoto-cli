import fs from 'fs/promises'
import { constants as fsc, write } from 'fs'
import path from 'path'
import os from 'os'

import inquirer from 'inquirer'

const CONFIG_PATH = '.config/timemoto-cli/config.json';

export type Config = {
    credentials: {
        username: string
        password: string
    }
}

export async function ensureConfig() {
    if (await configExists()) {
        return await readConfig();
    }

    const credentials = await askCredentials();
    const config: Config = { credentials };

    await writeConfig(config);
    return config;
}

function getConfigPath() {
    return path.join(os.homedir(), CONFIG_PATH);
}

async function readConfig(): Promise<Config> {
    return JSON.parse(await fs.readFile(getConfigPath(), { encoding: 'utf-8' }));
}

async function writeConfig(config: Config): Promise<void> {
    await fs.mkdir(path.dirname(getConfigPath()), { recursive: true });
    await fs.writeFile(getConfigPath(), JSON.stringify(config, null, 2), { encoding: 'utf-8' });
}

async function configExists(): Promise<boolean> {
    return await fileExists(getConfigPath());
}

async function fileExists(path: string) {
    return fs.stat(path)
        .then(r => r.isFile())
        .catch(() => false);
}

async function askCredentials(): Promise<{ username: string, password: string }> {
    return await inquirer.prompt<{ username: string, password: string }>([
        {
            type: 'input',
            name: 'username',
            message: 'Username',
        },
        {
            type: 'password',
            name: 'password',
            message: 'Password',
        },
    ])
}
