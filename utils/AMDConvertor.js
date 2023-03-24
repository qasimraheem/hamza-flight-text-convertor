const fs = require('fs');
const formatKeys = require('./formatKeys')
const path = require("path");

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
let flights = []
// read the text file
let text = null;

// split the text into an array of lines
let lines = null;

// create an empty object to hold the data
let data = {};
let isTable = false;
let isSubTable = false;
let subTable = [];
let isTableCompleted = false;
let flightRecord = null;

let isAirlineCode = false;
let isNotice = false;


async function getAMDTxtToJSON(file) {
  const filename = path.basename(file);
  const fileExt = path.extname(file);
  text = fs.readFileSync(file, 'utf-8');
  lines = text.trim().split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('---------------------')) {
      let headers = lines[i - 1].trim().split(/\s+/)
      if (headers.includes("DATE")) {
        isTable = true
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
        } else if (line === "") {
          data['TAXES/FEES/CARRIER IMPOSED CHARGES:'] = subTable
          isSubTable = false;
        }
      } else {
        isSubTable = true
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
            data['AIRLINE_CODE:'] = AirlineCode
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
        tempContineousVal = tempContineousVal.concat(" ", line);
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
      }
      if (line === "" || i + 1 === lines.length) {
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
      }
      if (!isTable && parts !== [""]) {
        if (isContineousValid) {
          if (line === "") {
            data[tempContineousKey] = tempContineousVal
            tempContineousVal = ""
            tempContineousKey = ""
            isContineousValid = false
          } else {
            tempContineousVal = tempContineousVal.concat(" ", line);
          }
        } else {
          let keyValues = findKeyValue(parts);
          data = {...data, ...keyValues}
        }
      } else if (isTable && /^\d+/.test(parts[0]) && !parts.includes("AT:")) {
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
          if (validKeys.includes(secondKey)) {
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
  data = formatKeys(data)
  return data
}

module.exports = getAMDTxtToJSON