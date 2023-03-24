const fs = require('fs');

async function saveFile(filename, data){
  fs.writeFileSync(filename+'.json',JSON.stringify(data))
}

module.exports = saveFile
