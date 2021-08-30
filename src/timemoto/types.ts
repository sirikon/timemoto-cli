export type TimemotoSession = {
    cookies: {
        auth: string
        csrf: string
    }
}

export type WorkingDay = {
    date: Date,
    duration: number
}
