const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Canvas = require('canvas');

const rootPath = path.join(__dirname, '..');

const Image = Canvas.Image;

const baseFilename = path.join(rootPath, 'img/base.png');

function splitString(text, count) {
  if (text.length < count) {
    return [text];
  } else {
    const truncated = _.truncate(text, {
      length: count,
      omission: ''
    }).trim();
    return _.concat([truncated], splitString(text.slice(truncated.length, text.length), count));
  }
}

function retardify(retardedAuthorImagePath, stupidText, outputPath, callback) {
  fs.readFile(baseFilename, function(err, baseBuffer) {
    if (err) {
      callback(err);
    }

    const baseImg = new Image();
    baseImg.dataMode = Image.MODE_IMAGE; // Only image data tracked
    baseImg.src = baseBuffer;

    fs.readFile(retardedAuthorImagePath, function(err, retardedAuthorImageBuffer) {
      if (err) {
        callback(err);
      }

      const retardedAuthorImage = new Image();
      retardedAuthorImage.dataMode = Image.MODE_IMAGE; // Only image data tracked
      retardedAuthorImage.src = retardedAuthorImageBuffer;

      const canvas = new Canvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext('2d');
      ctx.font = '24px Impact';

      ctx.drawImage(baseImg, 0, 0, baseImg.width, baseImg.height);
      ctx.drawImage(retardedAuthorImage, 190, 220, 60, 60);
      ctx.drawImage(retardedAuthorImage, 450, 120, 110, 110);
      ctx.fillText(`Aww, ain't you the`, 70, 80);
      ctx.fillText(`cutest lil thing`, 70, 110);
      ctx.fillText(`Oh no ...`, 130, 400);
      ctx.fillText(`It's retarded`, 390, 400);

      let splitSize = 32;
      let lineHeight = 20;
      ctx.font = '20px Impact';
      if (stupidText.length > 200) {
        lineHeight = 15;
      }
      if (stupidText.length > 150) {
        splitSize = 38;
        ctx.font = '18px Impact';
      }
      const splitStupidText = splitString(stupidText, splitSize);
      splitStupidText.reverse().forEach(function(slice, index) {
        ctx.fillText(slice, 320, 110 - index * lineHeight);
      });

      const newImageBuffer = canvas.toBuffer();
      const newImageName = path.basename(outputPath, '.png');

      const newImagePath = path.join(rootPath, `img/temp/${newImageName}_retarded.png`);
      fs.open(newImagePath, 'w', (err, fd) => {
        if (err) {
          callback(err);
        }
        fs.write(fd, newImageBuffer, 0, newImageBuffer.length, null, (err) => {
          if (err) {
            callback(err);
          }
          fs.close(fd, () => {
            callback(null, newImagePath);
          });
        });
      });

    });
  });
}

module.exports = {
  retardify: retardify
};
