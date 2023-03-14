const fs = require('fs');

const validKeys = [
  'NAME:',
  'ETKT_NBR:',
  'ISSUING_AIRLINE:',
  'ISSUING_AGENT:',
  'DATE_OF_ISSUE:',
  'IATA:',
  'BOOKING_REFERENCE:',
  'BOOKING_AGENT:',
  'LV:',
  'AT:',
  'AR:',
  'ARRIVE:',
  'DEPART:',
  'BAGS:',
  'VALID:',
  'FORM_OF_PAYMENT:',
  'FARE:',
  'TAX:',
  'TOTAL:',
  'EQUIV_AMT_PD:',
  'REF:'

]
const contineousValidKeys = [
  'ENDORSEMENTS:',
  'FARE_CALC:',
  'DATA_PROTECTION_NOTICE:',
]
let tempContineousKey = ""
let tempContineousVal = ""
let isContineousValid = false;
let foundAirlineInformation = false;
let airlineInformation = false;
let flights = []
// read the text file
const filename = 'AMD1'
const text = fs.readFileSync(filename+'.txt', 'utf-8');

// split the text into an array of lines
const lines = text.trim().split('\n');

// create an empty object to hold the data
let data = {};
let isTable = false;
let isSubTable = false;
let subTable = [];
let isTableCompleted = false;
let flightRecord = null;

let isAirlineCode = false;
let isNotice = false;
// iterate through each line and parse the information
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  console.log("line:", line)
  if (line.includes('---------------------')) {
    let headers = lines[i - 1].trim().split(/\s+/)
    console.log("Headers🗓️=>", headers)
    if (headers.includes("DATE")) {
      isTable = true
      console.log("table started")
    }
  }
  if (i === 0) {
    data.title = line
  } else if (i === 1) {
    data.subtitle = line
  } else if (line === 'TAXES/FEES/CARRIER IMPOSED CHARGES:' || isSubTable) {
    if (isSubTable) {
      if (line !== 'TAXES/FEES/CARRIER IMPOSED CHARGES:' && line !== "") {
        let parts = line.split(/\s+/)
        subTable.push(parts)
        console.log("subTable:", subTable)
      } else if (line === "") {
        data['TAXES/FEES/CARRIER IMPOSED CHARGES:'] = subTable
        isSubTable = false;
        console.log("isSubTable:", isSubTable)
      }
    } else {
      isSubTable = true
      console.log("isSubTable:", isSubTable)
    }
  } else if (line === 'AIRLINE CODE' || isAirlineCode) {
    if (isAirlineCode) {
      let AirlineCode = []
      let parts = line.split(/\s+/)
      for (let j = 0; j < parts.length; j++) {
        AirlineCode.push(parts[j])
        if (parts[j].includes('REF:')) {
          AirlineCode.pop()
          AirlineCode = AirlineCode.join(' ')
          data['AirlineCode:'] = AirlineCode
          data['REF:'] = line.replace(AirlineCode, '').replace('REF:', '').trim()
          isAirlineCode = false
          foundAirlineInformation = true
        }
      }
    } else {
      isAirlineCode = true;
    }

  } else if (foundAirlineInformation) {
    if (line !== "") {
      isContineousValid = true;
    }
    if (isContineousValid) {
      tempContineousVal = tempContineousVal.concat(" ",line);
      if (line === "") {
        data["information"] = tempContineousVal
        tempContineousVal = ""
        foundAirlineInformation = false
        isContineousValid = false;
      }
    }
  } else if (line === 'NOTICE' || isNotice) {
    isNotice = true;
    if (line !== "" && line !== 'NOTICE') {
      tempContineousVal = tempContineousVal.concat(" ", line);
      console.log("reading notice")
    }
    console.log(i,"<===>",lines.length, tempContineousVal)
    if(line === "" || i+1 === lines.length) {
      console.log("reading notice ended")
      data["notice"] = tempContineousVal
      tempContineousVal = ""
      isNotice = false;
    }

  } else {
    let parts = line.split(/\s+/)
    if (isTable && line === "") {
      isTable = false
      isTableCompleted = true
      flights.push(formatKeys(flightRecord))
      console.log("table ended")
    }
    console.log("parts:", parts)
    if (!isTable && parts !== [""]) {
      if (isContineousValid) {
        console.log("isContineousValid")
        if (line === "") {
          data[tempContineousKey] = tempContineousVal
          tempContineousVal = ""
          tempContineousKey = ""
          isContineousValid = false
        } else {
          tempContineousVal = tempContineousVal.concat(" ",line);
        }
      } else {
        let keyValues = findKeyValue(parts);
        console.log("keyValue:", keyValues)
        data = {...data, ...keyValues}
      }
    } else if (isTable && /^\d+/.test(parts[0]) && !parts.includes("AT:")) {
      console.log('record:')
      if (flightRecord) {
        flights.push(formatKeys(flightRecord))
        flightRecord = null
      }
      flightRecord = getFlightRecord(parts)

    } else if (isTable && parts.includes("AT:")) {
      if (parts.includes("LV:")) {
        flightRecord['departure'] = {...findKeyValue(parts), DATE: flightRecord.DATE};
      } else if (parts.includes("AR:")) {
        if (/^\d+/.test(parts[0])) {
          let DATE = parts.shift()
          flightRecord['arrival'] = {...findKeyValue(parts), DATE};
        } else {
          flightRecord['arrival'] = {...findKeyValue(parts), DATE: flightRecord.DATE};
        }
      }
    } else if (isTable && flightRecord !== null) {
      flightRecord = {...flightRecord, ...findKeyValue(parts)}
    } else if (isTableCompleted) {

    }
  }
}
data["flights"] = flights

function getFlightRecord(parts) {
  let length = parts.length
  let flightRecord = {
    DATE: parts[0],
    AIRLINE: "",
    FLT: parts[length - 4],
    CLASS: parts[length - 3],
    FARE_BASIS: parts[length - 2],
    STATUS: parts[length - 1],
  }
  for (let i = 1; i < parts.length - 4; i++) {
    flightRecord.AIRLINE = flightRecord.AIRLINE.concat(" ", parts[i])
  }
  flightRecord.AIRLINE = flightRecord.AIRLINE.trim()

  return flightRecord;
}

function findKeyValue(parts) {
  let data = {}
  let tempKey = ""
  let tempVal = ""
  let tempArray = []
  for (let i = 0; i < parts.length; i++) {
    tempArray.push(parts[i])
    if (tempKey === "" && parts[i].includes(":")) {
      //found first key
      tempKey = tempArray.join("_");
      if (contineousValidKeys.includes(tempKey)) {
        isContineousValid = true
        tempContineousKey = tempKey
        for (let d = i + 1; d < parts.length; d++) {
          tempContineousVal = tempContineousVal.concat(" ", parts[d]);
        }
      }
      tempArray = []
    }
    if (tempKey !== "" && parts[i].includes(":")) {
      //found another key
      let tempArrayBackup = tempArray
      let secondKey = null
      let isValidKey = false
      let tempArrayLength = tempArray.length
      for (let j = 0; j < tempArrayLength; j++) {
        let key = tempArray.pop();
        if (secondKey) {
          secondKey = key.concat("_", secondKey);
        } else {
          secondKey = key
        }
        console.log("secondKey:", secondKey)
        if (validKeys.includes(secondKey)) {
          console.log("secondKey: ✅")
          data[tempKey] = tempArray.join(" ")
          tempKey = secondKey
          tempArray = []
          isValidKey = true;
          break;
        }
      }
      if (!isValidKey) {
        tempArray = tempArrayBackup
        secondKey = null
      }
    }
  }
  if (tempKey !== "" && tempArray !== []) {
    data[tempKey] = tempArray.join(" ")
  }
  return data
}

function formatKeys(inputJson) {
  const outputJson = {};
  for (let key in inputJson) {
    let newKey = key.trim().toUpperCase().replace(/:/g, '');
    outputJson[newKey] = inputJson[key];
  }
  return outputJson;
}

data = formatKeys(data)
console.log(data); // output the JSON object
fs.writeFileSync(filename+'.json',JSON.stringify(data))