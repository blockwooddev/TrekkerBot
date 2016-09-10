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

//Setting up the Twitter library
var Twit = require('twit');
var T = new Twit(require('./config.js'));

//Start a stream to get tweets
var stream = T.stream('user');
stream.on('tweet', onTweet);

var globalTweetParams = {};
var botSN = 'trekkerbot';

var phraseBook = ['Engage.', 'Make it so.', 'Tea, Earl Grey, hot.', '*Adjust tunic*', 'Space... The final frontier. These are the voyages of the starship Enterprise. It\'s continuing mission, to explore strange new worlds. To seek out new life and new civilizations. To boldly go where no one has gone before.'];

//catch tweets that the bot is tagged in
function onTweet(tweet) {
    logger.debug("Got a tweet: " + JSON.stringify(tweet));
    if(tweet.in_reply_to_screen_name == botSN) {
        globalTweetParams.replySN = tweet.user.screen_name;
        logger.debug("Reply to: " + globalTweetParams.replySN);
        globalTweetParams.replyTweetId = tweet.id;
        logger.debug("Reply to tweet id: " + globalTweetParams.replyTweetId);
        logger.debug("In reply to screen name: " + tweet.in_reply_to_screen_name);
    
        logger.debug("We were tagged in the tweet! Tweet");
        tweetSomeTrek();
    }
}

//after the file upload, post the tweet
function tweetSomeTrek() {
    logger.debug("Tweeting a quote...");
    var mediaIdStr = data.media_id_string;
    logger.debug("media is: " + mediaIdStr);
    var phraseInd = Math.round(Math.random()*3);
    var params = {
            status: '@' + globalTweetParams.replySN + ': ' + phraseBook[phraseInd],
            in_reply_to_status_id: globalTweetParams.replyTweetId
    };
    T.post('statuses/update', params, handleTweetResponse);
}

//handle response from tweet request
function handleTweetResponse(error, data, response) {
    if (response) {
        logger.debug('Success! Check your bot, it should have tweeted an image.')
    }
    // If there was an error with our Twitter call, we print it out here.
    if (error) {
        logger.error('There was an error with Twitter:', error);
    }
}