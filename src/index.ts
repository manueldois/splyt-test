function Task1() {
    /**
     * Write a function defaultArguments . 
     * It takes a function as an argument, along with an object
     * containing default values for that function's arguments, 
     * and returns another function which defaults to the right values.
     * You cannot assume that the function's arguments have any particular names.
     * You should be able to call defaultArguments repeatedly to change the defaults
     */

    function getArgs(func) {
        // First match everything inside the function argument parens.
        var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

        // Split the arguments string into an array comma delimited.
        return args.split(',').map(function (arg) {
            // Ensure no inline comments are parsed and trim the whitespace.
            return arg.replace(/\/\*.*\*\//, '').trim();
        }).filter(function (arg) {
            // Ensure no undefined values are added.
            return arg;
        });
    }

    function defaultArguments(
        fn: any,
        defaults: Object
    ): any {
        if (fn.original) {
            fn = fn.original
        }

        const defaultValues = getArgs(fn)
            .map(
                (argName) => defaults[argName]
            )

        function boundFn(...args) {
            const newArgs = defaultValues.map(
                (val, i) => {
                    if (args[i] === undefined) {
                        return val
                    }
                    return args[i]
                }
            )

            return fn(
                ...newArgs
            )
        }

        boundFn.original = fn

        return boundFn
    }

    function add(a, b) {
        return a + b;
    };

    const add2 = defaultArguments(add, { b: 9 });
    console.assert(add2(10) === 19);
    console.assert(add2(10, 7) === 17);
    console.assert(isNaN(add2()));
    const add3 = defaultArguments(add2, { b: 3, a: 2 });
    console.assert(add3(10) === 13);
    console.assert(add3() === 5);
    console.assert(add3(undefined, 10) === 12);
    const add4 = defaultArguments(add, { c: 3 }); // doesn't do anything, since c isn't an argument
    console.assert(isNaN(add4(10)));
    console.assert(add4(10, 10) === 20);
}

function Task2() {
    /**
     * The businessmen among you will know that it's often not easy to find an appointment.
     *  In this task we want to find such an appointment automatically. 
     * You will be given the calendars of our businessmen and a
     * duration for the meeting. Your task is to find the earliest time, 
     * when every businessman is free for at least that duration.
     * All times in the calendars will be given in 24h format "hh:mm", the result must also be in that format
     * A meeting is represented by its start time (inclusively) and end time (exclusively) -> if a meeting takes
     * place from 09:00 - 11:00, the next possible start time would be 11:00
     * The businessmen work from 09:00 (inclusively) - 19:00 (exclusively), the appointment must start and
     * end within that range
     * If the meeting does not fit into the schedules, return null
     * The duration of the meeting will be provided as an integer in minutes
     */

    type Minute = number
    type Hour = number
    type HHMM = [Hour, Minute]
    type Duration<T> = T
    type TimeRange = [HHMM, HHMM]
    type Schedule = TimeRange[]

    const stringToHHMM = (s: string): HHMM => s.split(':').map(Number) as HHMM

    const HHMMToString = (t: HHMM): string => {
        const h = t[0]
        const m = t[1]

        const intToLongString = val => val < 10 ? `0${val}` : `${val}`

        return `${intToLongString(h)}:${intToLongString(m)}`
    }

    const arrayToArrayOfPairs = (arr) => arr.reduce((pairs, tr, i, arr) => {
        if (arr[i + 1]) {
            return [...pairs, [tr, arr[i + 1]]]
        }
        return pairs
    },
        []
    )

    const compareByStartDate = (tr1: TimeRange, tr2: TimeRange) => {
        const hourDiff = tr2[0][0] - tr1[0][0]
        const minuteDiff = tr2[0][1] - tr1[0][1]

        if (hourDiff === 0) {
            return -1 * Math.sign(minuteDiff)
        }
        return -1 * Math.sign(hourDiff)
    }

    const timeRangeDuration = (tr: TimeRange): Duration<Minute> => {
        const hourDiff = tr[1][0] - tr[0][0]
        const minuteDiff = tr[1][1] - tr[0][1]

        return hourDiff * 60 + minuteDiff
    }

    const toAvailableTimeRange = (tr1: TimeRange, tr2: TimeRange) => {
        return [tr1[1], tr2[0]]
    }

    const first = (arr) => arr[0]

    const last = (arr) => arr[arr.length - 1]

    function findSharedMeetingTime(schedules: string[][][], duration: Duration<Minute>) {
        // Who's busy does not matter
        const combinedSchedule: Schedule = schedules
            .flat()
            .map(
                dr => dr.map(
                    stringToHHMM
                ) as TimeRange
            )

        // Make sure busy time ranges go from start to end of day
        combinedSchedule.sort(compareByStartDate)

        const possibleIntervals = arrayToArrayOfPairs(
            combinedSchedule
        )
            .map(
                ([tr1, tr2]) => toAvailableTimeRange(tr1, tr2)
            )

        // Add possible interval for before first busy period
        // and after last busy period
        possibleIntervals.unshift(
            [[9, 0], first(combinedSchedule)[0]]
        )

        possibleIntervals.push(
            [last(combinedSchedule)[1], [19, 0]]
        )

        // Get the durations for all open intervals
        // Consider valid those where this duration is larger than requested
        const validIntervals = possibleIntervals
            .filter(
                tr => timeRangeDuration(tr) >= duration
            )

        // Return with the start of the first open valid interval,
        // or null
        const firstAvailableInterval = first(
            validIntervals
        )

        if (!firstAvailableInterval) {
            return null
        }

        return HHMMToString(
            firstAvailableInterval[0]
        )
    }

    const schedules1 = [
        [['09:00', '11:30'], ['13:30', '16:00'], ['16:00', '17:30'], ['17:45', '19:00']],
        [['09:15', '12:00'], ['14:00', '16:30'], ['17:00', '17:30']],
        [['11:30', '12:15'], ['15:00', '16:30'], ['17:45', '19:00']]
    ];

    const schedules2 = [
        [['09:00', '11:30'], ['13:30', '16:00']],
        [['09:15', '12:00'], ['14:00', '16:30']],
    ];

    const schedules3 = [
        [['09:00', '11:30']],
        [['09:15', '12:00']],
    ];

    const result = findSharedMeetingTime(schedules1, 60)

    console.log(result)
    console.assert(result, '12:15')
}


function main() {
    Task2()
}

setInterval(() => { }, 1000)
setTimeout(main, 3000)


