import querystring from 'querystring'
import axios from 'axios'

import { TIMEMOTO_BASE_URL, TIMEMOTO_COOKIE_CONSENT_LEVEL } from '../config';
import { TimemotoSession, WorkingDay } from "../types";

const TIMEMOTO_DAYS_URL = `${TIMEMOTO_BASE_URL}/Reports/Day_GridRead`;

export async function getDays(session: TimemotoSession, from: Date, to: Date): Promise<WorkingDay[]> {
    const requestBody = querystring.stringify({
        "sort": "UserId-asc",
        "page": "1",
        "pageSize": "25",
        "group": "",
        "filter": `LogTime~gte~'${formatDateForRequest(from)}'~and~LogTime~lte~'${formatDateForRequest(to)}'`,
        "showEmpty": "true",
        "shiftStart": "0",
        "userId": "-1"
    });

    const response = await axios.post(TIMEMOTO_DAYS_URL, requestBody, {
        headers: {
            'Cookie': buildCookies({
                __RequestVerificationToken: session.cookies.csrf,
                cookie_consent_level: TIMEMOTO_COOKIE_CONSENT_LEVEL,
                '.AspNet.Cookies.Admin': session.cookies.auth,
                cookie_consent_user_accepted: 'true'
            })
        }
    });

    return parseDays(response.data);
}

function buildCookies(cookies: Record<string, string>) {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}

function parseDays(daysResponseData: any): { date: Date, duration: number }[] {
    return daysResponseData.Data.map(parseDay);
}

function parseDay(day: any) {
    return {
        date: getDateFromRowId(day.RowId),
        duration: day.Duration
    }
}

function getDateFromRowId(rid: string) {
    const year = parseInt(rid.substr(0,4));
    const month = parseInt(rid.substr(4,2));
    const day = parseInt(rid.substr(6,2));
    return new Date(Date.UTC(year, month-1, day));
}

function formatDateForRequest(date: Date) {
    return [
        date.getUTCFullYear(),
        '-',
        zeroPad(date.getUTCMonth()+1),
        '-',
        zeroPad(date.getUTCDate()),
        'T',
        zeroPad(date.getUTCHours()),
        ':',
        zeroPad(date.getUTCMinutes()),
        ':',
        zeroPad(date.getUTCSeconds()),
        '.000'
    ].join('');
}

function zeroPad(number: number) {
    let result = number.toString();
    if (result.length === 1) {
        result = '0' + result;
    }
    return result;
}
