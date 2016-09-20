const uuid = require('uuid');
const server = require('http').createServer();
const url = require('url');
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server: server });
const express = require('express');
const multer  = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const ExifImage = require('exif').ExifImage;

const uploadDir = './uploads';

var diashowClients = [];

const broadcast = (clients, data) => {
  clients.forEach((client) => client.send(JSON.stringify(data)));
};

const imageOrientation = (value, done) => {
  try {
    new ExifImage({ image : value }, (err, exifData) => {
      if (err) return done(err);
      return done(null, exifData.image.Orientation);
    });
  } catch (err) {
    done(err);
  };
};

app.set('view engine', 'pug');
app.use(express.static('node_modules/simple-slideshow/src'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Hey', message: 'Hello there!'});
});

app.get('/diashow', (req, res) => {
  res.render('diashow');
});

wss.on('connection', (ws) => {
  var location = url.parse(ws.upgradeReq.url, true);

  ws.on('message', (message) => {
    if (message === 'diashow') {
      ws.id = uuid.v1();
      diashowClients.push(ws);
    }
    console.log('received: %s', message);
    fs.readdir(uploadDir, (err, files) => {
      if (err) return console.log(err);
      files.forEach((file) => {
        const parsed = path.parse(file);
        if (parsed.name !== '.DS_Store') {
          const data = {
            id: parsed.name,
            mimetype: 'image/jpeg'
          };
          fs.readFile(uploadDir + '/' + file, (err, file) => {
            if (err) return console.log(err);
            data.image = file.toString('base64');
            imageOrientation(file, (err, orientation) => {
              if (err) console.log(err);
              data.orientation = orientation;
              broadcast(diashowClients, data);
            });
          });
        }
      });
    });
  });
  ws.on('close', () => {
    diashowClients = diashowClients.filter((c) => c.id !== ws.id);
  });
});

app.post('/photos/upload', upload.single('photo'), (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  if(!req.file) {
    return res.status(301).end();
  }
  const id = uuid.v1();
  res.redirect('/');
  const data = req.body;
  data.id = id;
  data.image = req.file.buffer.toString('base64');
  data.mimetype = req.file.mimetype;
  imageOrientation(req.file.buffer, (err, orientation) => {
    data.orientation = orientation;
    console.log('writeFile!');
    fs.writeFile(uploadDir + '/' + id + '.jpg', req.file.buffer, (err) => {
      if (err) return console.log(err);
      console.log('broadcast!');
      broadcast(diashowClients, data);
    });
  });
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port) });
