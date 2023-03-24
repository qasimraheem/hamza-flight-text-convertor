const fs = require('fs');
const formatKeys = require('./formatKeys')
const csv = require('csvtojson');
const path = require('path');
import { PdfReader } from "pdfreader";
const { PdfDataParser } = require("pdf-data-parser");

let parser = new PdfDataParser({url: "../files/BSP.PDF"});

(async function myFunc() {
  new PdfReader().parseFileItems("test/sample.pdf", (err, item) => {
    if (err) console.error("error:", err);
    else if (!item) console.warn("end of file");
    else if (item.text) console.log(item.text);
  });
})()

//
// // read the text file
// const filename = '../files/BSP.PDF'
//
// //global variables
// let lines = null;
// let data = {};
// let headers = null;
// let tickets = [];
// let tableLastLine = null;
//
// async function getAirArabiaCSVToJSON(file) {
//   new PdfReader().parseFileItems(pdfFilePath, function (err, item) {
//     if (err) {
//       console.error(err);
//     }
//     console.log("item:", item)
//   })
//   console.log('data:', data)
// }
//
// (async () => {
//   await getAirArabiaCSVToJSON(filename)
// })()
//
// module.exports = getAirArabiaCSVToJSON
