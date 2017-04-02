var adapter = require('webrtc-adapter');
var gui = require('nw.gui');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var ffprobePath = require('@ffprobe-installer/ffprobe').path;
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Extend application menu for Mac OS
if (process.platform == "darwin") {
  var menu = new gui.Menu({type: "menubar"});
  menu.createMacBuiltin && menu.createMacBuiltin(window.document.title);
  gui.Window.get().menu = menu;
}

navigator.webkitGetUserMedia(
  {video: true, audio: true},
  function(stream) {
    var options = {mimeType: 'video/webm;codecs=vp8'};
    var mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = function(e) {
      if(e.data.size > 0) {
        var fileName = 'Record-'+Date.now();
        var chunks = [];
        chunks.push(e.data);
        var blob = new Blob(chunks, {type: 'video/webm'});
        var fileReader = new FileReader();
        fileReader.onload = function() {
          fs.writeFileSync(fileName + '.webm', Buffer.from(new Uint8Array(this.result)));
          ffmpeg(fileName + '.webm')
            .output(fileName + '.avi')
            .on('end', function() {
              ffmpeg(fileName + '.avi')
                .on('end', function() {
                  fs.unlink(fileName + '.webm', function(err){ });
                  fs.unlink(fileName + '.avi', function(err){ });
                })
                .screenshots({
                  count: 150, // 5seconds * 30fps = 150
                  filename: fileName,
                  folder: 'snapshots',
                  size: '650x480'
                });
            })
            .run()
        };
        fileReader.readAsArrayBuffer(blob);
      }
    }
    mediaRecorder.start();
    var timer = 0;
    var myInterval = setInterval(function(){
        timer++;
        if(timer >= 3) clearInterval(myInterval);
        mediaRecorder.stop();
        mediaRecorder.start();
    }, 5000);

    document.getElementById('mirror').src = URL.createObjectURL(stream);

  },
  function() {
    alert('Could not connect stream');
  }
);

gui.Window.get().show();
