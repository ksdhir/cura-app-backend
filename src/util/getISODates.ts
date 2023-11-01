import ISOStartString from "./ISOStartString";

function getISOHours(clientTimezone: string = "America/Vancouver") {
  const type = "Today";
  // generate isoStart
  const isoStart = ISOStartString(type, clientTimezone);
  const now = new Date();
  const isoNow = now.toISOString();

  const startTime = new Date(isoStart);
  const endTime = new Date(isoNow);

  // Initialize an array to store the ISO timestamps
  const isoArray = [];

  // Loop to generate ISO timestamps for each hour
  let currentTime = new Date(startTime);

  while (currentTime <= endTime) {
    isoArray.push(currentTime.toISOString());
    currentTime.setHours(currentTime.getHours() + 1);
  }

  return isoArray;
}

function getISODays(clientTimezone: string = "America/Vancouver") {
  const type = "WeekAgo";
  // generate isoStart
  const isoStart = ISOStartString(type, clientTimezone);

  const now = new Date();
  const isoNow = now.toISOString();

  const startTime = new Date(isoStart);
  const endTime = new Date(isoNow);

  // Initialize an array to store the ISO timestamps
  const isoArray = [];

  // Loop to generate ISO timestamps for each hour
  let currentTime = new Date(startTime);

  while (currentTime <= endTime) {
    isoArray.push(currentTime.toISOString());
    currentTime.setDate(currentTime.getDate() + 1);
  }
  return isoArray;
}

export { getISODays, getISOHours };
