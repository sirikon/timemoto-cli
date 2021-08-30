import moment from 'moment'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDuration(duration: number) {
    return moment.utc(0)
        .add(duration, 'seconds')
        .format('HH:mm')
}

export function formatDate(date: Date) {
    return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${DAY_NAMES[date.getUTCDay()]}`;
}
