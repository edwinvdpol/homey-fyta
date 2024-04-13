'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const { filled } = require('./Utils');
const { Status } = require('./Enums');

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

    try {
      // Get plant data from API
      data = await this.oAuth2Client.getPlant(this.getData().id);

      this.log('[Sync]', JSON.stringify(data));

      await this.syncSettings(data);
      await this.syncCapabilities(data);

      this.setAvailable().catch(this.error);
    } catch (err) {
      this.error('[Sync]', err.toString());
      this.setUnavailable(err.message).catch(this.error);
    } finally {
      data = null;
    }
  }

  /*
  | Synchronization functions
  */

  // Set capabilities
  async syncCapabilities(data) {
    if (!('measurements' in data)) {
      return;
    }

    let measure = data.measurements;

    // Battery
    if ('battery' in measure && filled(measure.battery)) {
      this.setCapabilityValue('measure_battery', Number(measure.battery)).catch(this.error);
    }

    // Values
    this.setCapabilityValue('measure_light', this.getValue('light', measure)).catch(this.error);
    this.setCapabilityValue('measure_moisture', this.getValue('moisture', measure)).catch(this.error);
    this.setCapabilityValue('measure_ph', this.getValue('ph', measure)).catch(this.error);
    this.setCapabilityValue('measure_salinity', this.getValue('salinity', measure)).catch(this.error);
    this.setCapabilityValue('measure_temperature', this.getValue('temperature', measure)).catch(this.error);

    // Status
    this.setCapabilityValue('status_light', this.getStatus('light', measure)).catch(this.error);
    this.setCapabilityValue('status_moisture', this.getStatus('moisture', measure)).catch(this.error);
    this.setCapabilityValue('status_nutrients', this.getStatus('nutrients', measure)).catch(this.error);
    this.setCapabilityValue('status_ph', this.getStatus('ph', measure)).catch(this.error);
    this.setCapabilityValue('status_salinity', this.getStatus('salinity', measure)).catch(this.error);
    this.setCapabilityValue('status_temperature', this.getStatus('temperature', measure)).catch(this.error);

    // Cleanup memory
    measure = null;
    data = null;
  }

  // Set new settings
  async syncSettings(data) {
    let settings = {};

    if ('scientific_name' in data) {
      settings.scientific_name = data.scientific_name;
    }

    if ('sensor' in data) {
      settings.sensor_version = data.sensor.version || '-';
    }

    if (filled(settings)) {
      this.setSettings(settings).catch(this.error);
    }

    // Cleanup memory
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

  /*
  | Support functions
  */

  // Get status of property from measurement
  getStatus(property, measure) {
    if (!(property in measure)) return 'unknown';

    return filled(measure[property].status)
      ? Status[measure[property].status]
      : 'unknown';
  }

  // Get value of property from measurement
  getValue(property, measure) {
    if (!(property in measure)) return 0;

    const field = property === 'ph' ? 'current' : 'currentFormatted';

    return filled(measure[property].values[field])
      ? Number(measure[property].values[field])
      : 0;
  }

}

module.exports = Device;
