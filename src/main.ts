import * as c from 'ansi-colors'

import * as timemoto from './timemoto'
import { formatDate, formatDuration } from './format'
import { ensureConfig } from './config/config';

async function main() {
    const config = await ensureConfig();

    const auth = await timemoto.login(config.credentials);
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

main().then(() => {}, (err) => console.log(err));
