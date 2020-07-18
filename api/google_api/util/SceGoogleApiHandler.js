const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { googleApiKeys } = require('../../config/config.json');
const nodemailer = require('nodemailer');

const {
  CLIENT_SECRET,
  CLIENT_ID,
  REDIRECT_URIS,
  USER,
  REFRESH_TOKEN,
} = googleApiKeys;

/**
 * Handles our website's backend to interace with various Google APIs. It also
 * is able to generate a token file for us to invoke the API calls.
 */
class SceGoogleApiHandler {
  /**
   * Create a SceGoogleApiHandler object.
   * @param {Array<String>} scopes Contains all of the Google APIs that we want
   * to use, e.g. ['http://mail.google.com', 'http://calendar.google.com',]
   * @param {String} tokenPath File path to read/write token data generated by
   * Google.
   */
  constructor(scopes, tokenPath) {
    this.runningInProduction = process.env.NODE_ENV === 'production';
    this.scopes = scopes;
    this.tokenPath = tokenPath;
    this.oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URIS[0]
    );
    this.oAuth2Client.setCredentials({
      // eslint-disable-next-line
      refresh_token: REFRESH_TOKEN,
    });
  }

  /**
   * Checks if the token file from the given path from the constructor exists.
   * It will either resolve a boolean false or an object containing the token
   * data.
   * @returns {Promise<boolean|Object>} The result of the token file search.
   */
  checkIfTokenFileExists() {
    return new Promise((resolve, reject) => {
      if (!this.runningInProduction) {
        resolve(false);
      }
      fs.readFile(this.tokenPath, (err, token) => {
        if (err) {
          resolve(false);
        } else {
          resolve(JSON.parse(token));
        }
      });
    });
  }

  /**
   * This function prompts the user to visit the OAuth playground on Google
   * Cloud's website to supply an authorization code to it. After recieving the
   * code the function writes a JSON token the token file path;
   */
  getNewToken() {
    if (!this.runningInProduction) return;

    const authUrl = this.oAuth2Client.generateAuthUrl({
      // eslint-disable-next-line
      access_type: 'offline',
      scope: this.scopes,
    });
    console.debug('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      'Enter the authorization code(under "Step 2") from that page here: ',
      (code) => {
        rl.close();

        this.oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.debug('Error retrieving access token', err);
          this.oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(this.tokenPath, JSON.stringify(token), (err) => {
            if (err) return console.debug('ERR', err);
            console.debug('Token stored to', this.tokenPath);
          });
        });
      }
    );
  }

  /**
   * Check if a token object is expired based on its expiry_date field.
   * @param {Object} token the token to check.
   */
  checkIfTokenIsExpired(token) {
    return Date.now() >= token.expiry_date;
  }

  /**
   * This function refreshes a Google API token if it is found to be expired.
   */
  refreshToken() {
    if (!this.runningInProduction) return;
    this.oAuth2Client.setCredentials({
      // eslint-disable-next-line
      refresh_token: REFRESH_TOKEN,
    });

    this.oAuth2Client.getAccessToken().then((token) => {
      fs.writeFile(this.tokenPath, JSON.stringify(token.res.data), (err) => {
        if (err) return console.debug(err);
      });
    });
  }

  /**
   * Grabs all the events for a given calendar by its id.
   * will log the next 10 events into the console.
   * @param calendarId {string} calendar id for which calendar to pull from
   * @returns {{Array<Object>|Error)} The calendar events from Google or an
   * error.
   */
  getEventsFromCalendar(calendarId, numOfEvents) {
    return new Promise((resolve, reject) => {
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oAuth2Client,
      });
      calendar.events.list(
        {
          calendarId: calendarId,
          timeMin: new Date().toISOString(),
          maxResults: numOfEvents,
          singleEvents: true,
          orderBy: 'startTime',
        },
        (err, res) => {
          if (err) return reject(false);
          const events = res.data.items;
          if (events.length) {
            resolve(events);
          } else {
            reject(false);
          }
        }
      );
    });
  }

  /**
   * Sends an email from sce.sjsu@gmail.com. The parameter defines recipient,
   * subject and email body.
   * @param {nodemailer.envelope} mailTemplate The email template to send.
   */
  async sendEmail(mailTemplate) {
    return new Promise(async (resolve, reject) => {
      if (!this.runningInProduction) {
        resolve();
      }
      const smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: USER,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
        },
      });

      smtpTransport.sendMail(mailTemplate, (error, response) => {
        error ? reject(error) : resolve(response);
        smtpTransport.close();
      });
    });
  }
}

module.exports = { SceGoogleApiHandler };
