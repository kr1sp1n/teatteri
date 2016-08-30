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
var diashowClients = [];

const broadcast = (clients, data) => {
  clients.forEach((client) => client.send(JSON.stringify(data)));
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
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', (message) => {
    if (message === 'diashow') {
      ws.id = uuid.v1();
      diashowClients.push(ws);
    }
    console.log('received: %s', message);
  });
  ws.on('close', () => {
    diashowClients = diashowClients.filter((c) => c.id !== ws.id);
  });
  // ws.send(JSON.stringify({}));
});

app.post('/photos/upload', upload.single('photo'), (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  const id = uuid.v1();
  res.status(204).end();
  const data = req.body;
  data.id = id;
  data.image = req.file.buffer.toString('base64');
  data.mimetype = req.file.mimetype;
  broadcast(diashowClients, data);
});

server.on('request', app);
server.listen(port, () => { console.log('Listening on ' + server.address().port) });
