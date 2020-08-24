const querystring = require('querystring');
const axios = require('axios').default;
const { JSDOM } = require("jsdom");

const TIMEMOTO_HOST = 'app.timemoto.com'
const TIMEMOTO_BASE_URL = `https://${TIMEMOTO_HOST}`;
const TIMEMOTO_LOGIN_URL = `${TIMEMOTO_BASE_URL}/Account/Login?ReturnUrl=%2F`;
const TIMEMOTO_DAYS_URL = `${TIMEMOTO_BASE_URL}/Reports/Day_GridRead`;
const TIMEMOTO_COOKIE_CONSENT_LEVEL = '%7B%22strictly-necessary%22%3Atrue%2C%22functionality%22%3Atrue%2C%22tracking%22%3Atrue%2C%22targeting%22%3Atrue%7D';

async function login(username, password) {
    const loginPageResponse = await axios.get(TIMEMOTO_LOGIN_URL);
    const loginPageDOM = new JSDOM(loginPageResponse.data);
    const csrfToken = loginPageDOM.window.document.querySelector('form input[name="__RequestVerificationToken"]').getAttribute('value');
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
        authCookie,
        csrfCookie
    };
}

async function getDays(auth, from, to) {
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
                __RequestVerificationToken: auth.csrfCookie,
                cookie_consent_level: TIMEMOTO_COOKIE_CONSENT_LEVEL,
                '.AspNet.Cookies.Admin': auth.authCookie,
                cookie_consent_user_accepted: 'true'
            })
        }
    });

    return parseDays(response.data);
}

function buildCookies(cookies) {
    const result = [];
    Object.keys(cookies).forEach(k => {
        result.push(`${k}=${cookies[k]}`);
    });
    return result.join('; ');
}

function parseDays(daysResponseData) {
    return daysResponseData.Data.map(parseDay);
}

function parseDay(day) {
    //return day;
    return {
        date: getDateFromRowId(day.RowId),
        duration: day.Duration
    }
}

function getDateFromRowId(rid) {
    const year = parseInt(rid.substr(0,4));
    const month = parseInt(rid.substr(4,2));
    const day = parseInt(rid.substr(6,2));
    return new Date(Date.UTC(year, month-1, day));
}

function formatDateForRequest(date) {
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

function zeroPad(number) {
    let result = number.toString();
    if (result.length === 1) {
        result = '0' + result;
    }
    return result;
}

module.exports = {
    login,
    getDays
}
