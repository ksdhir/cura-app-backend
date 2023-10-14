import { HEART_RATE } from "../constants";


function getHeartRateThreshold(age: number): {min: number, max: number} {
    if(HEART_RATE[age]) {
        return {"min": HEART_RATE[age][0], "max": HEART_RATE[age][1]}
    } else if (age < 20) { 
        return {"min": HEART_RATE[20][0], "max": HEART_RATE[20][1]};
    } else if(age > 90) {
        return {"min": HEART_RATE[90][0], "max": HEART_RATE[90][1]};
    } else {
        // calculate where does the user fall
        const allAges = Object.keys(HEART_RATE).map(x => Number(x));

        const closestAge: number = allAges.reduce((a: number, b: Number) => {
            const aDiff = Math.abs(Number(a) - age);
            const bDiff = Math.abs(Number(b) - age);
            return aDiff < bDiff ? Number(a) : Number(b);
          });

        return {"min": HEART_RATE[closestAge][0], "max": HEART_RATE[closestAge][1]};
    }
}


export default getHeartRateThreshold;