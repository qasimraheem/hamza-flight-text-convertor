const fs = require('fs');
const formatKeys = require('./formatKeys')
const csv = require('csvtojson');


//global variables
let lines = null;
let data = {};
let headers = null;
let tickets = [];
let tableLastLine = null;

async function getSereneCSVToJSON(file){
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
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (i >= 1) {
      let data = await csv({noheader: true}).fromString(line)
      if (i === 1) {
        headers = {...data[0]}
        console.log("headers:", headers)
      } else {
        let object = {...data[0]}
        for (let key in object) {
          object[headers[key]] = object[key]
          delete object[key]
        }
        console.log("object:", object)
        tickets.push(formatKeys(object))
      }
    }
  }
}


module.exports = getSereneCSVToJSON
