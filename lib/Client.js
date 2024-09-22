'use strict';

const { OAuth2Client } = require('homey-oauth2app');
const fetch = require('homey-oauth2app/lib/OAuth2Fetch');
const OAuth2Error = require('homey-oauth2app/lib/OAuth2Error');
const Token = require('./Token');
const Plant = require('../models/Plant');

class Client extends OAuth2Client {

  static API_URL = 'https://web.fyta.de/api';
  static TOKEN_URL = 'https://web.fyta.de/api/auth/login';
  static TOKEN = Token;

  /*
  | Plant functions
  */

  // Return all active plants
  async discoverPlants() {
    const plants = await this.getPlants();

    return plants
      .filter((plant) => plant.valid)
      .map((plant) => plant.data)
      .filter((e) => e);
  }

  // Return all plants
  async getPlants() {
    const data = await this._get('/user-plant');
    const plants = data.plants || [];

    return plants.map((data) => new Plant(data));
  }

  // Return single plant
  async getPlant(id) {
    const data = await this._get(`/user-plant/${id}`);

    return new Plant(data.plant || {});
  }

  /*
  | Support functions
  */

  // Perform GET request
  async _get(path) {
    this.log('GET', path);

    return this.get({
      path,
      query: '',
      headers: {},
    });
  }

  /*
  | Client events
  */

  // Client initialized
  async onInit() {
    this.log('Initialized');
  }

  // Client destroyed
  async onUninit() {
    this.log('Destroyed');
  }

  // Get token by credentials
  async onGetTokenByCredentials({ username, password }) {
    this.log('[Token] Requesting');

    // Initiate token
    this._token = new Token({ username, password });

    // Request token from API
    const response = await fetch(this._tokenUrl, {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return this.onHandleGetTokenByCredentialsError({ response });
    }

    this._token = await this.onHandleGetTokenByCredentialsResponse({ response });

    this.log('[Token] Requested:', JSON.stringify(this._token));

    // Return token
    return this.getToken();
  }

  // Request response is not OK
  async onHandleNotOK({
    body, status, statusText, headers,
  }) {
    this.error('Request not OK', JSON.stringify({
      body,
      status,
      statusText,
      headers,
    }));

    // Client errors
    if (status === 401 || status === 403 || status === 404) {
      return new Error(this.homey.__(`error.${status}`));
    }

    // Internal server error
    if (status >= 500 && status < 600) {
      return new Error(this.homey.__('error.50x'));
    }

    // Custom error message
    if ('error' in body) {
      return new Error(body.error);
    }

    // Unknown error
    return new Error(this.homey.__('error.unknown'));
  }

  // Handle result
  async onHandleResult({
    result, status, statusText, headers,
  }) {
    if (typeof result === 'object') {
      return result;
    }

    this.error('Invalid response', result);

    throw new Error(this.homey.__('error.50x'));
  }

  // Refresh token
  async onRefreshToken() {
    this.log('[Token] Refreshing');

    const token = this.getToken();

    if (!token) {
      throw new OAuth2Error('Missing Token');
    }

    // Request token from API
    const response = await fetch(this._tokenUrl, {
      method: 'POST',
      body: JSON.stringify({
        email: this.username,
        password: this.password,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return this.onHandleRefreshTokenError({ response });
    }

    this._token = await this.onHandleRefreshTokenResponse({ response });

    this.log('[Token] Refreshed:', JSON.stringify(this._token));
    this.save();

    // Return token
    return this.getToken();
  }

  // Request error
  async onRequestError({ err }) {
    this.error('Request error', err.message);

    throw new Error(this.homey.__('error.network'));
  }

  /*
  | Getter functions
  */

  get password() {
    return this._token ? this._token.password : null;
  }

  get username() {
    return this._token ? this._token.username : null;
  }

}

module.exports = Client;
