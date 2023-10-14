const IS_FIREBASE_MIDDLEWARE = false;

//HEART RATE CONSTANTS
const MAX_HEART_RATE = 180;
const MIN_HEART_RATE = 60;

// data sources: 
// https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates
// https://uihc.org/health-topics/target-heart-rate-exercise
// depending on the age recommend heart rate
const HEART_RATE: Record<number, [number, number]> = {
    20: [100, 170],
    30: [95, 162],
    35: [93, 157],
    40: [90, 153],
    45: [88, 149],
    50: [85, 145],
    55: [83, 140],
    60: [80, 136],
    65: [78, 132],
    70: [75, 128],
    75: [73, 123],
    80: [70, 119],
    85: [68, 115],
    90: [65, 110],
}

export { IS_FIREBASE_MIDDLEWARE, MAX_HEART_RATE, MIN_HEART_RATE, HEART_RATE };
