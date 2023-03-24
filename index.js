const fs = require('fs');
const path = require('path');
const getAirArabiaCSVToJSON = require('./utils/AirArabiaConvertor')
const getSereneCSVToJSON = require('./utils/SereneConvertor')
const getAirSialXlsxToJSON = require('./utils/AirSialConvertor')
const getAMDTxtToJSON = require('./utils/AMDConvertor')
const getFlyDubaiXlsxToJSON = require('./utils/FlydubaiConvertor')
const saveFile = require('./utils/saveFile')


let fiesConvertors = {
  'Air Arabia.csv': getAirArabiaCSVToJSON,
  'Fly Jinnah.csv': getAirArabiaCSVToJSON,
  'AirSial.xlsx': getAirSialXlsxToJSON,
  'AMD1.txt': getAMDTxtToJSON,
  'AMD2.txt': getAMDTxtToJSON,
  'Flydubai.xlsx': getFlyDubaiXlsxToJSON,
  'Serene.csv': getSereneCSVToJSON,
}


class Convertor {
  constructor() {
    this.filename = '';
    this.data = null;
    this.outputDir = 'output';
    this.inputDir = 'files';
    this.fileExt = null;
  }


  setInputDir(dir) {
    this.inputDir = dir;
  }

  getInputDir() {
    return this.inputDir;
  }

  setOutputDir(dir) {
    this.outputDir = dir;
  }

  getOutputDir() {
    return this.outputDir;
  }

  async formFile(file) {
    const fileName = path.basename(file); // returns 'myfile.txt'
    const fileExt = path.extname(file); // returns '.txt'
    this.filename = fileName
    this.fileExt = fileExt
    this.data = await getAirArabiaCSVToJSON(file)
    return this.data;
  }

  async formDirectory(path = null) {
    if (!path) {
      path = this.inputDir
    }
    let files = fs.readdirSync(path)
    for (let i = 0; i < files.length; i++) {
      let data = await this.toJSON(path+'/'+files[i])
      await this.save(this.outputDir+'/'+files[i], data)
    }
  }

  async toJSON(file) {
    const filename = path.basename(file);
    if (fiesConvertors.hasOwnProperty(filename)) {
      return await fiesConvertors[filename](file);
    } else {
      return Error("File doesn't have convertor")
    }
  }

  async save(file = null, data = null) {
    if (!file) {
      file = this.filename
    }
    if (!data) {
      data = this.data
    }
    console.log("saving ", file)
    await saveFile( file, data)
    return true;
  }

}


(async () => {
  let convertor = new Convertor()
  await convertor.formDirectory();
  // await convertor.save()
})()
