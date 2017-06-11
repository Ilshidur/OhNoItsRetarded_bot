const fs = require('fs');
const path = require('path');
const Twit = require('twit');
const request = require('request');
const retardify = require('./image_edit').retardify;
const config = require('./config');

const T = new Twit(config);
const stream = T.stream('user');
const myUsername = 'OhNoRetardedBot';

const rootPath = path.join(__dirname, '..');

stream.on('tweet', onTweetEvent);

function onTweetEvent(tweetEvent) {
  const originalTweetAuthor = tweetEvent.in_reply_to_screen_name;
  const originalTweetAuthorImageUrl = tweetEvent.user.profile_image_url_https;
  const originalStatusId = tweetEvent.in_reply_to_status_id_str;
  const tweetUser = tweetEvent.user.screen_name;

  const tweetText = tweetEvent.text;
  const tweetOnlyMatches = tweetText.match(`/^@${myUsername} (.*)$/g`);
  const tweetOnly = tweetOnlyMatches ? tweetOnlyMatches[0] : '...';

  T.get('statuses/show/:id', { id: originalStatusId }, function (err, originalStatus, response) {
    const originalStatusText = originalStatus.text;

    if (originalTweetAuthor === myUsername) {
      // Direct tweet
      tweet(tweetUser, tweetOnly, originalStatusId, originalTweetAuthorImageUrl);
    } else if (originalTweetAuthor !== null && tweetUser !== myUsername) {
      // Tweet is a reply to an other user
      // Also prevent the bot to answer at itself (it's not THAT retarded)
      tweet(originalTweetAuthor, originalStatusText, originalStatusId, originalTweetAuthorImageUrl);
    }
  });
}

function tweet(author, stupidText, statusId, retardedAuthorImageUrl) {
  const retardedAuthorImagePath = path.join(rootPath, `img/temp/${author}.jpg`);

  request(retardedAuthorImageUrl)
    .pipe(fs.createWriteStream(retardedAuthorImagePath))
    .on('error', function(err) {
      console.error(err);
    })
    .on('close', function() {

      const currentTimestamp = Date.now();
      const outputDir = path.join(rootPath, `img/temp/${statusId}_${currentTimestamp}.jpg`);

      retardify(retardedAuthorImagePath, stupidText, outputDir, function(newImagePath) {

        const params = {
          encoding: 'base64'
        };
        const b64 = fs.readFileSync(newImagePath, params);

        T.post('media/upload', { media_data: b64 }, function uploaded(err, data, response) {
          if (err) {
            console.error(err);
          }

          const id = data.media_id_string;
          const tweet = {
            status: `@${author} Oh no, it's retarded ...`,
            in_reply_to_status_id: statusId,
            media_ids: [id]
          };

          T.post('statuses/update', tweet, function tweeted(err, data, response) {
            if (err) {
              console.error(err);
            } else {
              console.log('Tweeted back !');
            }
          });
        });

      });

    });
}

// tweet('Ilshidur', 'Retarded text', '123456', 'https://pbs.twimg.com/profile_images/815672741638635520/0ZIb8Spu_normal.jpg');
