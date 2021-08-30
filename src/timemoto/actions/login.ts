import querystring from 'querystring'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import { Config } from '../../config/config';
import { TIMEMOTO_BASE_URL, TIMEMOTO_COOKIE_CONSENT_LEVEL } from '../config';
import { TimemotoSession } from '../types';

const TIMEMOTO_LOGIN_URL = `${TIMEMOTO_BASE_URL}/Account/Login?ReturnUrl=%2F`;

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
