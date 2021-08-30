import * as c from 'ansi-colors'

import * as timemoto from './timemoto/index'
import { formatDate, formatDuration } from './format'
import { ensureConfig } from './config/config';
import moment from 'moment';

type DateRange = {
    from: Date,
    to: Date
}

async function main() {
    const config = await ensureConfig();
    const currentWeek = getCurrentWeek();

    const session = await timemoto.login(config.credentials);
    const days = await getDays(session, currentWeek);

    days.forEach(day => {
        if ([6, 0].indexOf(day.date.getDay()) >= 0) {
            console.log(c.grey(`${formatDate(day.date)} -> Weekend`));
            return;
        }
        console.log(`${formatDate(day.date)} -> ${formatDuration(day.duration)}`);
    });
}

async function getDays(session: timemoto.TimemotoSession, dayRange: DateRange) {
    return await timemoto.getDays(session, dayRange.from, dayRange.to);
}

function getCurrentWeek(): DateRange {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const firstDay = moment(today).add(- ((today.getUTCDay() - 1 + 7) % 7), 'day').toDate();
    
    return {
        from: firstDay,
        to: moment(firstDay).add(6, 'day').toDate()
    }
}

main().then(() => {}, (err) => console.log(err));
