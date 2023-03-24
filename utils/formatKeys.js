function formatKeys(inputJson) {
  const outputJson = {};
  for (let key in inputJson) {
    let newKey = key.trim().toUpperCase().replace(/:/g, '').replace(/[- .]+/g,'_');
    outputJson[newKey] = inputJson[key];
  }
  return outputJson;
}
module.exports = formatKeys