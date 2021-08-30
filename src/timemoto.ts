import querystring from 'querystring'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import { Config } from './config/config';

const TIMEMOTO_HOST = 'app.timemoto.com'
const TIMEMOTO_BASE_URL = `https://${TIMEMOTO_HOST}`;
const TIMEMOTO_LOGIN_URL = `${TIMEMOTO_BASE_URL}/Account/Login?ReturnUrl=%2F`;
const TIMEMOTO_DAYS_URL = `${TIMEMOTO_BASE_URL}/Reports/Day_GridRead`;
const TIMEMOTO_COOKIE_CONSENT_LEVEL = '%7B%22strictly-necessary%22%3Atrue%2C%22functionality%22%3Atrue%2C%22tracking%22%3Atrue%2C%22targeting%22%3Atrue%7D';

export type TimemotoSession = {
    cookies: {
        auth: string
        csrf: string
    }
}

export async function login({ username, password }: Config['credentials']): Promise<TimemotoSession> {
    const loginPageResponse = await axios.get(TIMEMOTO_LOGIN_URL);
    const loginPageDOM = new JSDOM(loginPageResponse.data);

    const csrfToken = loginPageDOM.window.document.querySelector('form input[name="__RequestVerificationToken"]')!.getAttribute('value');
    const csrfCookie = loginPageResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const loginRequestBody = querystring.stringify({
        __RequestVerificationToken: csrfToken,
        Email: username,
        Password: password
    });

    const loginResponse = await axios.post(TIMEMOTO_LOGIN_URL, loginRequestBody, {
        maxRedirects: 0,
        validateStatus: function (status) {
            return status >= 200 && status < 400;
        },
        headers: {
            'Cookie': `__RequestVerificationToken=${csrfCookie}; cookie_consent_level=${TIMEMOTO_COOKIE_CONSENT_LEVEL}`
        }
    });

    if (!loginResponse.headers['set-cookie']) {
        throw new Error("Login failed");
    }

    const authCookie = loginResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];

    return {
        cookies: {
            auth: authCookie,
            csrf: csrfCookie
        }
    };
}

export async function getDays(session: TimemotoSession, from: Date, to: Date) {
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
