var fs = require('fs'); 
var util = require('util');

function fileExists(filePath){
  try {
    var file = fs.statSync(filePath);
    return file['size'];
  } 
  catch (err) {return false;}
}

function currdatetime() {
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
} 

function report(stats, p) {
  console.log(util.format('\r\033[K[%s] %s%% speed %s/s | done %s skipped %s | %s left',
    pad(formatDuration(process.uptime()), 4, true),
    pad((p.percentage).toFixed(4), 8, true),
    pad(formatNumber(p.speed),4,true),
    formatNumber(stats.done - stats.skipped),
    formatNumber(stats.skipped),
    formatDuration(p.eta)
  ));
}

function formatDuration(duration) {
  var seconds = duration % 60;
  duration -= seconds;
  var minutes = (duration % 3600) / 60;
  duration -= minutes * 60;
  var hours = (duration % 86400) / 3600;
  duration -= hours * 3600;
  var days = duration / 86400;

  return (days > 0 ? days + 'd ' : '') +
    (hours > 0 || days > 0 ? hours + 'h ' : '') +
    (minutes > 0 || hours > 0 || days > 0 ? minutes + 'm ' : '') +
    seconds + 's';
}

function pad(str, len, r) {
  while (str.length < len) str = r ? ' ' + str : str + ' ';
  return str;
}

function formatNumber(num) {
  num = num || 0;
  if (num >= 1e6) 
    return (num / 1e6).toFixed(2) + 'm'; 
  else if (num >= 1e3)
    return (num / 1e3).toFixed(1) + 'k'; 
  else
    return num.toFixed(0);
    
  return num.join('.');
}

function msToTime(duration) {
  var milliseconds = parseInt((duration%1000)/100),
      seconds = parseInt((duration/1000)%60),
      minutes = parseInt((duration/(1000*60))%60),
      hours = parseInt((duration/(1000*60*60))%24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;
  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

module.exports.msToTime = msToTime;
module.exports.report = report;
module.exports.currdatetime = currdatetime;
module.exports.fileExists = fileExists;

