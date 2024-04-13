/* eslint-disable camelcase */

'use strict';

const { OAuth2App } = require('homey-oauth2app');
const { Log } = require('homey-log');
const Client = require('./Client');

class App extends OAuth2App {

  static OAUTH2_CLIENT = Client;

  /*
  | Application events
  */

  // Application initialized
  async onOAuth2Init() {
    // Sentry logging
    this.homeyLog = new Log({ homey: this.homey });

    // Register flow cards
    this.registerFlowCards();

    this.log('Initialized');
  }

  // Application destroyed
  async onUninit() {
    this.log('Destroyed');
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
