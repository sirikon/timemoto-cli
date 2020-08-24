const fs = require('fs');
const path = require('path');
const os = require('os');

const c = require('ansi-colors');
const inquirer = require('inquirer');

const timemoto = require('./timemoto');
const { formatDate, formatDuration } = require('./format');

const CONFIG_PATH=".config/timemoto-cli/config.json";

async function main() {
    const config = await ensureConfig();

    const auth = await timemoto.login(config.credentials.username, config.credentials.password);
    const days = await timemoto.getDays(
        auth,
        new Date(Date.UTC(2020, 7, 10)),
        new Date(Date.UTC(2020, 7, 24)));
        
    days.forEach(day => {
        if ([6, 0].indexOf(day.date.getDay()) >= 0) {
            console.log(c.grey(`${formatDate(day.date)} -> Weekend`));
            return;
        }
        console.log(`${formatDate(day.date)} -> ${formatDuration(day.duration)}`);
    });
}

async function ensureConfig() {
    const configPath = path.join(os.homedir(), CONFIG_PATH);
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8' }));
    }
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    const credentials = await askCredentials();
    const config = { credentials };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', { encoding: 'utf8' });
    return config;
}

async function askCredentials() {
    return await inquirer.prompt([
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

main().then(() => {}, (err) => console.log(err));
