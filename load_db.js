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
var overflow_file = './overflow.csv';
var difference; //allocating here so it's not reallocated every time
var inputStream = fs.createReadStream(filename);

var lineReader = readline.createInterface({
    input: inputStream
});

lineReader.on('line', processLine);

pg.defaults.ssl = true;
var pool = new pg.Pool(config);
var dburl = process.env.DATABASE_URL;

function processLine(line) {
  if(line.length > 120) {
      difference = (line.length - 120); 
  
      logger.error("Phrase: " + line);
      logger.error("Phrase was longer than 120 characters.");
      logger.error("You are " + difference + " characters over.");
      
      fs.appendFileSync(overflow_file, line + "; " + difference + "\n");
      return;
  }
  logger.debug("Line: " + line);
  pool.connect(dburl, function(err, client) {          
    if (err) throw err;
    logger.debug('Connected to postgres! Getting schemas...');
    line = line.replace(/'/g, '\'\'');
    var formattedquery = 'INSERT INTO phrase(phraseText) VALUES(\'' + line + '\')';
    
    logger.debug(formattedquery);
    client.query(formattedquery, function(err) {
        console.log("Insert command");
        if(err) throw err;
        
        
        client.end(function (err) {
            if (err) throw err;
        })
    });
  });
}