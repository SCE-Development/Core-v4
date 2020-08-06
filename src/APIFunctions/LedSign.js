import axios from 'axios';
import { ApiResponse } from './ApiResponses';
import { RPC_API_URL, LOGGING_API_URL } from '../config/config.json';

/**
 * Checks to see if the sign is accepting requests. This is done
 * before any requests to update the sign can be made.
 * @param {string} officerName The name of the officer requesting the sign
 * @returns {ApiResponse} ApiResponse Object containing the response data
 */
export async function healthCheck(officerName) {
  let status = new ApiResponse();
  await axios
    .post(RPC_API_URL + '/LedSign/healthCheck', { officerName })
    .then(res => {
      status.responseData = res.data;
    })
    .catch(err => {
      status.responseData = err;
      status.error = true;
    });
  return status;
}

/**
 * Retrieve all sign logs.
 * @returns {ApiResponse} Containing any error information related to the
 * request.
 */
export async function getAllSignLogs() {
  let result = new ApiResponse();
  await axios
    .get(LOGGING_API_URL+'/SignLog/getSignLogs')
    .then(res => {
      result.responseData = res.data;
    })
    .catch(err => {
      result.responseData = err;
      result.error = true;
    });
  return result;
}

/**
 * Update the text of the sign.
 * @param {Object} signData - An object containing all of the sign data (text,
 * colors, etc.) sent to the RPC client.
 * @returns {ApiResponse} Containing any error information related to the
 * request
 */
export async function updateSignText(signData) {
  let status = new ApiResponse();
  await axios
    .post(RPC_API_URL + '/LedSign/updateSignText', { ...signData })
    .then(res => {
      status = res.data;
    })
    .catch(err => {
      status.responseData = err;
      status.error = true;
    });
  return status;
}

/**
 * Retrieve all sign messages.
 * @returns {ApiResponse} Containing sign messages
 */
export async function getAllSignMessages() {
  let result = new ApiResponse();
  await axios
    .get(RPC_API_URL + '/SceRpcApi/LedSign/getSignMessages')
    .then(res => {
      console.log(res.data);
      result = res.data;
    })
    .catch(err => {
      result.responseData = err;
      result.error = true;
    });
  return result;
}
