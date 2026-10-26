const {transformFileSync}=require('@babel/core');
const path=require('node:path');
const cache=new Map();
module.exports=function loadSource(file) {
  const filename=path.resolve(file);
  if(cache.has(filename))return cache.get(filename).exports;
  const loaded={exports:{}};cache.set(filename,loaded);
  const code=transformFileSync(filename,{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
  new Function('module','exports','require',code)(loaded,loaded.exports,(specifier)=>specifier.startsWith('.')
    ?module.exports(path.resolve(path.dirname(filename),specifier.endsWith('.js')?specifier:`${specifier}.js`)):require(specifier));
  return loaded.exports;
};
