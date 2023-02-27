import {format, lastDayOfMonth} from 'date-fns';

export const getStandardFormattedDateTime = (date: Date = new Date(), outputDateFormat: string = 'yyyy-MM-dd HH:mm:ss') => {
    return format(date, outputDateFormat);
};

export const getFirstAndLastDateOfActualMonth = (): {
    firstDateOfMonth: string;
    lastDateOfMonth: string;
}  => {
    const today = new Date();
    return {
        firstDateOfMonth: getStandardFormattedDateTime(today, 'yyyy-MM-01 00:00:00'),
        lastDateOfMonth: getStandardFormattedDateTime(lastDayOfMonth(today), 'yyyy-MM-dd 23:59:59'),
    };
};