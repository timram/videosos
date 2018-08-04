const fs = require('fs');
const youdl = require('youtube-dl');
const { flow } = require('lodash/fp');
const path = require('path');

const clearExtensions = name => name.replace(/\.\w*$/, '');

const getConfig = () => {
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'loader.conf.json')));
  const videos = config.videos || [];
  const publicPath = config.publicPath || './';
  return { videos, publicPath };
};

const getVideoLoaderDescriptor = url => youdl(
  url,
  ['--audio-format=mp3', '-x'],
  { cwd: __dirname }
);

const logVidoeInfo = info => {
  console.log(`Download started: "${info._filename}" -- size: ${info.size}`);
  return info;
};

const getWriteStream = (resolve, publicPath) => info => {
  const writeStream = fs.createWriteStream(`${publicPath}${clearExtensions(info._filename)}.mp3`);

  writeStream.on('finish', function() {
    console.log(`${info._filename} is loaded`);
    resolve(true);
  });

  return writeStream;
};

const pipeVideoToWriteStream = video => writeStream => video.pipe(writeStream);

const loadVideo = (url, publicPath) => new Promise(resolve => {
  const video = getVideoLoaderDescriptor(url);

  video.on('info', flow(
    logVidoeInfo,
    getWriteStream(resolve, publicPath),
    pipeVideoToWriteStream(video)
  ));

  video.on('error', err => {
    console.log(err);
    resolve(true);
  });
});

async function main() {
  const { videos, publicPath } = getConfig();
  
  await Promise.all(videos.map(v => loadVideo(v, publicPath)));
  
  console.log('All videos are loaded');
}

main();