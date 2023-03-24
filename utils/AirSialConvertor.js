const fs = require('fs');
const formatKeys = require('./formatKeys')
const XLSX = require('xlsx');
const path = require("path");
// const getAirArabiaCSVToJSON = require('./utils/AirArabiaConvertor')
// read the text file
let tickets = null;
let data = {};

async function getAirSialXlsxToJSON(file){
  const filename = path.basename(file); // returns 'myfile.txt'
  const fileExt = path.extname(file); // returns '.txt'
  const workbook = XLSX.readFile(file);
  await getSheetsData(workbook)
  return data
}
async function getSheetsData(workbook) {
  workbook.SheetNames.forEach((sheet) => {
    const worksheet = workbook.Sheets[sheet];
    getWorkSheetData(worksheet, sheet)
  })
}

function getWorkSheetData(worksheet, sheetName = null) {
  sheetName = sheetName.toUpperCase()
  data[sheetName] = {};
  tickets = XLSX.utils.sheet_to_json(worksheet);
  tickets = tickets.map((ticket) => {
    if (isNaN(ticket.Ticket)) {
      let object = {};
      let title = ticket.Ticket;
      delete ticket.Ticket
      object[title] = {...ticket}
      data[sheetName] = {...data[sheetName], ...object}
    } else {
      return formatKeys(ticket)
    }
  }).filter(v => v)
  data[sheetName] = {
    TICKETS: tickets
  }
}
module.exports = getAirSialXlsxToJSON