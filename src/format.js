const moment = require('moment');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDuration(duration) {
    return moment.utc(0).add(duration, 'seconds').format('HH:mm')
}

function formatDate(date) {
    return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${DAY_NAMES[date.getUTCDay()]}`;
}

module.exports = {
    formatDuration,
    formatDate
};
