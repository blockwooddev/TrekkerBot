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
var url = require('url');
var overflow_file = './overflow.csv';
var difference; //allocating here so it's not reallocated every time
const params = url.parse(process.env.DATABASE_URL);
const auth = params.auth.split(':');
var filename;

if(process.argv.length < 3) {
    logger.error("Too few command line arguments! Must include filename of phrase to add to db.");
    process.exit(1);
} else {
    filename = process.argv[2];
}
var inputStream = fs.createReadStream(filename);

var pool_config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true    
};

var pool = new pg.Pool(pool_config);

var lineReader = readline.createInterface({
    input: inputStream
});

lineReader.on('line', processLine);

function processLine(line) {
  if(line.length > 120) {
      difference = (line.length - 120); 
  
      logger.error("Phrase: " + line);
      logger.error("Phrase was longer than 120 characters.");
      logger.error("You are " + difference + " characters over.");
      
      fs.appendFileSync(overflow_file, line + "; " + difference + "\n");
      return;
  }
  
  pool.connect(function(err, client, done) {          
    if (err) throw err;
    logger.debug('Connected to postgres! Getting schemas...');
    line = line.replace(/'/g, '\'\'');
    var formattedquery = 'INSERT INTO phrase(phraseText) VALUES(\'' + line + '\')';
    
    logger.debug(formattedquery);
    client.query(formattedquery, function(err) {
        if(err) throw err;
        
        done();
    });
  });
}