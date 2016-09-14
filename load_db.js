//Setting up the logger
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ 
          filename: 'debug.log'
      })
    ]
  });

logger.level = 'debug';

var pg = require('pg');
var fs = require('fs');
var readline = require('readline');
var filename = './phrases.csv';
var inputStream = fs.createReadStream(filename);

var lineReader = readline.createInterface({
    input: inputStream
});

lineReader.on('line', processLine);

pg.defaults.ssl = true;
var dburl = process.env.DATABASE_URL;

function processLine(line) {
  if(line.length > 120) return;
  logger.debug("Line: " + line);
  logger.debug("Database URL: " + dburl);
  pg.connect(dburl, function(err, client) {          
    if (err) throw err;
    logger.debug('Connected to postgres! Getting schemas...');
    line = line.replace(/'/g, '\'\'');
    var formattedquery = 'INSERT INTO phrase(phraseText) VALUES(\'' + line + '\')';

    client.query(formattedquery, function(err) {
        console.log("Insert command");
        if(err) throw err;
        
        
        client.end(function (err) {
            if (err) throw err;
        })
    });
  });
}