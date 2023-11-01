

export function consolidateData(type: string, heartRateRecords: Array<any>, timestamps: Array<any>) {

  const givenTimestamps = timestamps;
  // ================================> Prepare Total Data Object
  const totalData = givenTimestamps.reduce((acc, key) => {
    acc[key] = { total: 0, item: 0 };
    return acc;
  }, {} as Record<string, { total: number; item: number }>);


  // loop through heartRateRecords and add to totalData
  for (let record of heartRateRecords) {
    const beatsPerMinute = record.beatsPerMinute;
    const timestamp = record.timestamp;

    if (type == "week") {
        const matchingTimestamp = withinOneDay(timestamp.toISOString(), givenTimestamps);
        if (matchingTimestamp) {
          totalData[matchingTimestamp].total += beatsPerMinute;
          totalData[matchingTimestamp].item += 1;
        }      
    } else if (type == "day") {
      
      const matchingTimestamp = withinOneHour(timestamp.toISOString(), givenTimestamps);
      if (matchingTimestamp) {
        totalData[matchingTimestamp].total += beatsPerMinute;
        totalData[matchingTimestamp].item += 1;
      }
    }
  }

  // ================================> Prepare Average Data Object

  const consolidatedData: Record<string, number> = {};
    for (let key in totalData) {
    if (totalData[key].item > 0 && totalData[key].total > 0) {
      consolidatedData[key] = totalData[key].total / totalData[key].item;
    } else {
      consolidatedData[key] = 0;
    }
    }
  
  return consolidatedData;
}



// ================================> Usage
function withinOneDay(currentTimestamp: string, timestamps: Array<string>) {
  const currentTimestampDate = new Date(currentTimestamp);
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  for (const timestamp of timestamps) {
    const timestampDate = new Date(timestamp);
    const timeDifference = Math.abs(
      timestampDate.getTime() - currentTimestampDate.getTime()
    );
    // if the timedifference is less than 24 hours, return the timestamp
    if (timeDifference < twentyFourHours) {
      return timestamp;
    }
  }
  return null; // Return null if no matching timestamp is found within 24 hours
}


function withinOneHour(currentTimestamp: string, timestamps: Array<string>) {
  const currentTimestampDate = new Date(currentTimestamp);
  const twentyFourHours = 1 * 60 * 60 * 1000; // 24 hours in milliseconds

  for (const timestamp of timestamps) {
    const timestampDate = new Date(timestamp);
    const timeDifference = Math.abs(
      timestampDate.getTime() - currentTimestampDate.getTime()
    );
    // if the timedifference is less than 24 hours, return the timestamp
    if (timeDifference < twentyFourHours) {
      return timestamp;
    }
  }
  return null; // Return null if no matching timestamp is found within 24 hours
}