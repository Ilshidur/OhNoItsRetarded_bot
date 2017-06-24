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
  // Nullable. If the represented Tweet is a reply, this field will contain the screen name of the original Tweet’s author
  const originalTweetAuthor = tweetEvent.in_reply_to_screen_name;
  // Nullable If the represented Tweet is a reply, this field will contain the integer representation of the original Tweet’s ID
  const originalStatusId = tweetEvent.in_reply_to_status_id_str;

  const tweetUser = tweetEvent.user.screen_name;
  const tweetUserImageUrl = tweetEvent.user.profile_image_url_https;

  if (tweetUser === myUsername) {
    // If the tweet comes from the bot : do not reply.
    return;
  }

  const tweetId = tweetEvent.id_str;
  const tweetText = tweetEvent.text;
  const tweetOnlyMatches = tweetText.match(new RegExp(`^@${myUsername} (.*)$`));
  const tweetOnly = tweetOnlyMatches ? tweetOnlyMatches[1] : '...';

  if (!originalStatusId) {
    // The tweet is an original post
    tweet(tweetUser, tweetOnly, tweetId, tweetUserImageUrl);
  } else {
    // The tweet is a reply
    T.get('statuses/show/:id', { id: originalStatusId }, function (err, originalStatus, response) {
      const originalStatusText = originalStatus.text;
      const originalStatusAuthorImageUrl = originalStatus.user.profile_image_url_https;

      tweet(originalTweetAuthor, originalStatusText, originalStatusId, originalStatusAuthorImageUrl);
    });
  }
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

      retardify(retardedAuthorImagePath, stupidText, outputDir, function(err, newImagePath) {
        if (err) {
          console.error(err);
        }

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
