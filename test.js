const csvFilePath = 'Air Arabia.csv';
const csv = require('csvtojson');

(async ()=>{
  let data = await csv().fromFile(csvFilePath)
  console.log("data:",data);
})()
