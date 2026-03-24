'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const Data = require('./Data');
const { blank, filled } = require('./Utils');

class Device extends OAuth2Device {

  static SYNC_INTERVAL = 15; // Minutes

  /*
  | Device events
  */

  // Device added
  async onOAuth2Added() {
    this.log('Added');
  }

  // Device deleted
  async onOAuth2Deleted() {
    this.log('Deleted');
  }

  // Device initialized
  async onOAuth2Init() {
    // Connecting to API
    await this.setUnavailable(this.homey.__('authentication.connecting'));

    // Register timer
    this.registerTimer();

    // Synchronize
    await this.sync();

    this.log('Initialized');
  }

  // Device destroyed
  async onOAuth2Uninit() {
    // Unregister timer
    this.unregisterTimer();

    this.log('Destroyed');
  }

  // Device synchronize
  async sync() {
    let data;
    let raw;

    try {
      // Get plant from API
      raw = await this.oAuth2Client.getPlant(this.getData().id);

      // Create data object
      data = new Data(raw);

      // Device not found
      if (blank(data)) throw new Error(this.homey.__('error.404'));

      this.log('[Sync]', JSON.stringify(data));

      // Synchronize data
      await this.syncCapabilityValues(data);
      await this.syncSettings(data);

      this.setAvailable().catch(this.error);
    } catch (err) {
      this.error('[Sync]', err.message);
      this.setUnavailable(err.message).catch(this.error);
    } finally {
      data = null;
      raw = null;
    }
  }

  // Set capability values
  async syncCapabilityValues(data) {
    for (const name of this.getCapabilities()) {
      if (name in data && data[name] !== this.getCapabilityValue(name)) {
        this.setCapabilityValue(name, data[name]).catch(this.error);
        this.log(`[Sync] Device changed capability '${name}' to '${data[name]}'`);
      }
    }

    data = null;
  }

  // Set settings
  async syncSettings(data) {
    let settings = {};

    for (const [name, old] of Object.entries(this.getSettings())) {
      if (name in data && old !== data[name]) {
        this.log(`Setting '${name}' is now '${data[name]}'`);
        settings[name] = data[name];
      }
    }

    if (filled(settings)) {
      this.setSettings(settings).catch(this.error);
    }

    settings = null;
    data = null;
  }

  /*
  | Timer functions
  */

  // Register timer
  registerTimer() {
    if (this.syncTimer) return;

    const interval = 1000 * 60 * this.constructor.SYNC_INTERVAL;

    this.syncTimer = this.homey.setInterval(this.sync.bind(this), interval);

    this.log('[Timer] Registered');
  }

  // Unregister timer
  unregisterTimer() {
    if (!this.syncTimer) return;

    this.homey.clearInterval(this.syncTimer);

    this.syncTimer = null;

    this.log('[Timer] Unregistered');
  }

}

module.exports = Device;
