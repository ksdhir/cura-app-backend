// Generates Backdates for the Timezone in UTC ISO Format


// calculate offset between UTC and Timezone

function getTimeZoneOffset(timeZone: string) {
  const date = new Date();
  let iso = date.toLocaleString('en-CA', { timeZone, hour12: false })
  const isoDate = new Date(iso);

  // generate values for ISO string
  const year = isoDate.getFullYear();
  const month = String(isoDate.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(isoDate.getDate()).padStart(2, '0');
  const hours = String(isoDate.getHours()).padStart(2, '0');
  const minutes = String(isoDate.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

  const lie = new Date(isoString);

  const offset = ((lie.getTime() - date.getTime()) / 60 / 1000);

  const hoursDiff = offset / 60
  return hoursDiff;
}



function generateISOWithOffset(offset: number) {

  // Calculate the hours and minutes from the decimal offset
  const hours = Math.trunc(offset);
  const minutes = (offset - hours) * 60;

  // Create a Date object for midnight with the calculated hours and minutes
  const midnight = new Date();
  midnight.setUTCHours(0 - hours, 0 - minutes, 0, 0);
  
  // currentUTC date
  const currentUTC = new Date();
  console.log(midnight, 'midnight')
  console.log(currentUTC, 'currentUTC')

  // adjust future date
  if (midnight > currentUTC) {
    midnight.setDate(midnight.getDate() - 1);
  }

  // Generate the ISO string
  return midnight.toISOString();

}


function ISOStartString(type: string, timeZone: string) {
  if (type == "Today") {
    const offset = getTimeZoneOffset(timeZone);
    const utc = generateISOWithOffset(offset);
    return utc;

  } else if (type == "WeekAgo") {
    const offset = getTimeZoneOffset(timeZone);
    const utc = generateISOWithOffset(offset);
    const givenDate = new Date(utc);
    // Calculate 7 days ago
    const sevenDaysAgo = new Date(givenDate);
    sevenDaysAgo.setDate(givenDate.getDate() - 7);
    const isoSevenDaysAgo = sevenDaysAgo.toISOString();
    return isoSevenDaysAgo;
  } else {
    return null;
  }
}


// ================================> Usage
// const today = ISOStartString("Today", 'America/Vancouver')
// console.log(today)
// const weekAgo = ISOStartString("WeekAgo", 'America/Vancouver')
// console.log(weekAgo)

export default ISOStartString;