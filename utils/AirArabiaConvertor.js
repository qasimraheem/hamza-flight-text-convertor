const fs = require('fs');
const formatKeys = require('./formatKeys')
const csv = require('csvtojson');
const path = require('path');


// read the text file
const filename = 'Air Arabia'

//global variables
let lines = null;
let data = {};
let headers = null;
let tickets = [];
let tableLastLine = null;

async function getAirArabiaCSVToJSON(file){
  const filename = path.basename(file); // returns 'myfile.txt'
  const fileExt = path.extname(file); // returns '.txt'
  const text = fs.readFileSync(file, 'utf-8');
  lines = text.trim().split('\n');
  await getTableData();
  await getFileData();
  data['TICKETS'] = tickets;
  return data
}
async function getFileData() {
  for (let i = 2; i < lines.length; i++) {
    let line = lines[i].trim();
    if (i === 2) {
      data['COMPANY'] = line.replace(/,/g, '')
    } else if (i === 3) {
      let parts = line.split(',');
      data['FROM_DATE'] = parts[1].replace(':', '');
      data['REPORT_ID'] = parts[8]
    } else if (i === 4) {
      let parts = line.split(',');
      data['TO_DATE'] = parts[1].replace(':', '');
      data['PRINT_DATE'] = parts[8]
    } else if (i === 5) {
      let parts = line.split(',');
      data['ENTITY'] = parts[1].replace(':', '');
      i = tableLastLine - 1;
    } else if (i === tableLastLine) {
      let parts = await csv({noheader: true}).fromString(line)
      data['GRAND_TOTAL'] = parts[0].field8
    } else if (i === tableLastLine + 1) {
      let parts = await csv({noheader: true}).fromString(line)
      data['NET_AMOUNT'] = parts[0].field8
      break;
    }
  }
}

async function getTableData() {
  // iterate through each line and parse the information
  for (let i = 7; i < lines.length; i++) {
    const line = lines[i];
    if (i >= 7) {
      // console.log("line:", line)
      let data = await csv({noheader: true}).fromString(line)
      if (i === 7) {
        headers = {...data[0]}
      } else {
        let object = {...data[0]}
        for (let key in object) {
          object[headers[key]] = object[key]
          delete object[key]
        }
        if (!object['PNR']) {
          tableLastLine = i
          // console.log('breaking here', tableLastLine)
          break;
        } else {
          object.ROUTING = formatFlightRouting(object)
          tickets.push(formatKeys(object))
        }
      }
    }
  }
}

function formatFlightRouting(object) {
  let routes = object['Routing'].split(';')
  let formatedRoutes = []
  routes.forEach((route) => {
    route = route.trim()
    let parts = route.split(' ')
    let routeObject = {
      DATE: parts[0],
      FROM: parts[1].split('/')[0],
      TO: parts[1].split('/')[1],
      FLIGHT_NUMBER: parts[2],
      STATUS: parts[3],
    }
    formatedRoutes.push(routeObject)
  })
  return formatedRoutes
}

module.exports = getAirArabiaCSVToJSON
