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

//Setting up the Twitter library
var Twit = require('twit');
var T = new Twit(require('./twit-config.js'));

//Start a stream to get tweets
var stream = T.stream('user');
stream.on('tweet', onTweet);

var globalTweetParams = {};
var botSN = 'trekkerbot';

pg.defaults.ssl = true;
var dburl = process.env.DATABASE_URL;

//simple defense against endless convos w/ bots
var last_sn = '';
var back_and_forth_count = 1;
var MAX_BNF = 10;

//catch tweets that the bot is tagged in
function onTweet(tweet) {
    logger.debug("Got a tweet: " + JSON.stringify(tweet));
    if(tweet.in_reply_to_screen_name.toLowerCase() == botSN) {
        globalTweetParams.replySN = tweet.user.screen_name;
        logger.debug("Reply to: " + globalTweetParams.replySN);
        globalTweetParams.replyTweetId = tweet.id;
        logger.debug("Reply to tweet id: " + globalTweetParams.replyTweetId);
        logger.debug("In reply to screen name: " + tweet.in_reply_to_screen_name);
        
        if(globalTweetParams.replySN == last_sn) {
            if(back_and_forth_count <= MAX_BNF) {
                logger.debug("" + back_and_forth_count + " tweets in a row to " + last_sn);
                back_and_forth_count++;
            } else {
                back_and_forth_count++; //for record-keeping
                logger.debug("Tweets in a row to " + last_sn + " exceeded threshold. Total: " + back_and_forth_count);
                return;
            }
        } else {
            back_and_forth_count = 1;
            last_sn = globalTweetParams.replySN;
        }
        
        tweetSomeTrek();
    }
}

//after the file upload, post the tweet
function tweetSomeTrek() {
    logger.debug("Tweeting a quote...");
    var randPhrase = '';
    pg.connect(dburl, function(err, client) {          
        if (err) throw err;
        
        logger.debug('Connected to postgres! Getting schemas...');
        
        var formattedquery = 'SELECT phraseText FROM phrase ORDER BY RANDOM() LIMIT 1';
        client.query(formattedquery, function(err, result) {
            console.log("Insert command");
            if(err) throw err;
            
            if(result.rows != null) {
                logger.debug(result.rows);
                randPhrase = result.rows[0].phrasetext;
                logger.debug("randPhrase: " + randPhrase)
                var params = {
                        status: '@' + globalTweetParams.replySN + ': ' + randPhrase,
                        in_reply_to_status_id: globalTweetParams.replyTweetId
                };
                T.post('statuses/update', params, handleTweetResponse);
            }
            
            client.end(function (err) {
                if (err) throw err;
            })
        });
      });
    
}

//handle response from tweet request
function handleTweetResponse(error, data, response) {
    if (response) {
        logger.debug('Success! Sharing the joys of Star Trek')
    }
    // If there was an error with our Twitter call, we print it out here.
    if (error) {
        logger.error('There was an error with Twitter:', error);
    }
}