/* eslint-disable camelcase */

'use strict';

const { OAuth2App } = require('homey-oauth2app');
const { Log } = require('homey-log');
const OAuth2Util = require('homey-oauth2app/lib/OAuth2Util');
const Client = require('./Client');
const { blank } = require('./Utils');

class App extends OAuth2App {

  static OAUTH2_CLIENT = Client;

  /*
  | Application events
  */

  // Application initialized
  async onOAuth2Init() {
    // Sentry logging
    this.homeyLog = new Log({ homey: this.homey });

    // Register unload event listener
    this.homey.on('unload', () => this.onOAuth2Uninit());

    // Register flow cards
    this.registerFlowCards();

    this.log('Initialized');
  }

  // Application destroyed
  async onOAuth2Uninit() {
    this.log('Destroyed');
  }

  /*
  | OAuth2 functions
  */

  // Set client for OAuth2 devices
  async setClientOAuth2Devices(client, OAuth2SessionId, OAuth2ConfigId) {
    let devices = await this.getDevices();
    if (blank(devices)) return;

    this.log('Update device clients');

    for (const device of devices) {
      await device.onOAuth2Uninit();
      await device.setStoreValue('OAuth2SessionId', OAuth2SessionId);
      await device.setStoreValue('OAuth2ConfigId', OAuth2ConfigId);

      device.oAuth2Client = client;

      await device.onOAuth2Init();
    }

    devices = null;
  }

  // Return devices
  async getDevices() {
    let result = [];

    for (const driverId of this.constructor.OAUTH2_DRIVERS) {
      let driver;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          driver = this.homey.drivers.getDriver(driverId);
          break;
        } catch (err) {
          await OAuth2Util.wait(500);
        }
      }

      // Wait for driver
      await driver.ready();

      // Get devices
      const devices = driver.getDevices();

      result = [...devices, ...result];
    }

    return result;
  }

  /*
  | Flow card functions
  */

  // Register flow cards
  registerFlowCards() {
    this.log('[FlowCards] Registering');

    // Condition flow cards
    // ... and light state is ...
    this.homey.flow.getConditionCard('status_light').registerRunListener(async ({ device, status_light }) => {
      return device.getCapabilityValue('status_light') === status_light;
    });

    // ... and moisture state is ...
    this.homey.flow.getConditionCard('status_moisture').registerRunListener(async ({ device, status_moisture }) => {
      return device.getCapabilityValue('status_moisture') === status_moisture;
    });

    // ... and nutrients state is ...
    this.homey.flow.getConditionCard('status_nutrients').registerRunListener(async ({ device, status_nutrients }) => {
      return device.getCapabilityValue('status_nutrients') === status_nutrients;
    });

    // ... and pH state is ...
    this.homey.flow.getConditionCard('status_ph').registerRunListener(async ({ device, status_ph }) => {
      return device.getCapabilityValue('status_ph') === status_ph;
    });

    // ... and salinity state is ...
    this.homey.flow.getConditionCard('status_salinity').registerRunListener(async ({ device, status_salinity }) => {
      return device.getCapabilityValue('status_salinity') === status_salinity;
    });

    // ... and temperature state is ...
    this.homey.flow.getConditionCard('status_temperature').registerRunListener(async ({ device, status_temperature }) => {
      return device.getCapabilityValue('status_temperature') === status_temperature;
    });

    this.log('[FlowCards] Registered');
  }

}

module.exports = App;
