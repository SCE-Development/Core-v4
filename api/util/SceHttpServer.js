const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const https = require('https')
const mongoose = require('mongoose');
const fs = require('fs')
const path = require('path')
mongoose.Promise = require('bluebird');

const { PathParser } = require('./PathParser');

/**
 * Class responsible for resolving paths of API endpoints and combining them
 * them into an express server.
 */
class SceHttpServer {
  /**
   * Store port information, create express server object and configure
   * BodyParser options.
   * @param {(String|Array<String>)} pathToEndpoints The path to a single
   * server file, directory or array of directories/files;
   * @param {Number} port The port for the server to listen on.
   * @param {String} prefix The prefix of the api endpoints to send requests
   * to, e.g. /api/Event/addEvent, with /api/ being the prefix.
   */
  constructor(pathToEndpoints, port, prefix = '/api/') {
    const testEnv = process.env.NODE_ENV === 'test';
    this.runningInProduction = process.env.NODE_ENV === 'production';
    this.database = testEnv ? 'sce_core_test' : 'sce_core';
    this.port = port;
    this.pathToEndpoints = pathToEndpoints;
    this.prefix = prefix;
    this.app = express();
    this.app.locals.title = 'Core v4';
    this.app.locals.email = 'test@test.com';

    this.app.use(cors());
    this.app.use(
      bodyParser.json({
        // support JSON-encoded request bodies
        limit: '50mb',
        strict: true,
      })
    );
    this.app.use(
      bodyParser.urlencoded({
        // support URL-encoded request bodies
        limit: '50mb',
        extended: true,
      })
    );
    //this.app.use(redirectToHTTPS([/localhost:(\d{4})/], 301));
  }

  /**
   * This function is responsible for taking the pathToEndpoints instance
   * variable and resolving API endpoints from it.
   */
  async initializeEndpoints() {
    this.pathToEndpoints.map(async(endpoint) => {
      const requireList = await PathParser.parsePath(endpoint);
      requireList.map((route) => {
        this.app.use(this.prefix + route.endpointName, require(route.filePath));
      });
    }) 
    
  }

  /**
   * Create the http server, connect to MongoDB and start listening on
   * the supplied port.
   */
  openConnection() {
    this.server = http.createServer(this.app);
    this.connectToMongoDb();
    const { port } = this;

    this.app.get("*", function (req, res, next) {
      res.redirect("https://" + req.headers.host + req.path);
    });

    this.server.listen(port, function() {
      console.debug(`Now listening on port ${port}`);
    });
  }

  /**
   * Initialize a connection to MongoDB.
   */
  connectToMongoDb() {
    this.mongoose = mongoose;
    this.mongoose
      .connect(`mongodb://localhost/${this.database}`, {
        promiseLibrary: require('bluebird'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      })
      .then(() => {})
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Create the https server, connect to MongoDB and start listening on
   * the supplied port.
   */
  httpsOpenConnection() {
    const options = {
      key: fs.readFileSync(path.join(__dirname, '../../sce.key')),
      cert: fs.readFileSync(path.join(__dirname, '../../sce_engr_sjsu_edu.cer'))
    };
  
    this.app.use(express.static(path.join(__dirname, '../../build')));
    this.app.get('*', function(req, res) {
      res.sendFile(path.join(__dirname, '../../build/index.html'));
    });

  this.app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '../../build/index.html'));
  });
    this.server = https.createServer(options, this.app);
    this.connectToMongoDb();
    
    this.server.listen(443, function() {
      console.debug(`Now listening on port ${443}`);
    });
  }

  /**
   * Return the current instance of the HTTP server. This function is useful
   * for making chai HTTP requests in our API testing files.
   * @returns {http.Server} The current instance of the HTTP server.
   */
  getServerInstance() {
    return this.server;
  }

  /**
   * Close the connection to MongoDB and stop the server.
   * @param {Function|null} done A function supplied by mocha as a callback to
   * signify that we have completed stopping the server.
   */
  closeConnection(done = null) {
    this.server.close();
    this.mongoose.connection.close(done);
  }
}

// This if statement checks if the module was require()'d or if it was run
// by node server.js. If we are not requiring it and are running it from the
// command line, we create a server instance and start listening for requests.
if (typeof module !== 'undefined' && !module.parent) {
  const generalApiEndpoints = __dirname + '/../main_endpoints/routes/';
  const loggingApiEndpoints = __dirname + '/../logging_api/routes/';
  const cloudApiEndpoints = __dirname + '/../cloud_api/routes/';

  const generalServer = new SceHttpServer([generalApiEndpoints, loggingApiEndpoints, cloudApiEndpoints], 80);
  const httpsServer = new SceHttpServer([generalApiEndpoints, loggingApiEndpoints, cloudApiEndpoints], 443);
 
  
  generalServer.initializeEndpoints().then(() => {
    generalServer.openConnection();
  });
  httpsServer.initializeEndpoints().then(() => {
    httpsServer.httpsOpenConnection();
  });
  // loggingServer.initializeEndpoints().then(() => {
  //   loggingServer.openConnection();
  // });
  // cloudServer.initializeEndpoints().then(() => {
  //   cloudServer.openConnection();
  // });
}

module.exports = { SceHttpServer };
