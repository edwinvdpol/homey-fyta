'use strict';

const { Status } = require('../lib/Enums');
const { filled } = require('../lib/Utils');

class Plant {

  /**
   * Represents a plant.
   *
   * @constructor
   */
  constructor(data) {
    this.id = data.id;
    this.measurements = data.measurements || null;
    this.nickname = data.nickname;
    this.scientific_name = data.scientific_name;
    this.sensor_version = data.sensor?.version;
    this.status = data.status || 0;
  }

  /**
   * Return whether device is active.
   *
   * @return {boolean}
   */
  get active() {
    return this.status !== 0;
  }

  /**
   * Return battery level.
   *
   * @return {number|null}
   */
  get battery() {
    const battery = this.measurements?.battery;

    return battery ? Number(battery) : null;
  }

  /**
   * Return device capability values.
   *
   * @return {Object}
   */
  get capabilityValues() {
    if (!this.valid) return {};

    return Object.fromEntries(Object.entries({
      measure_battery: this.battery,
      measure_light: this.measureValue('light'),
      measure_moisture: this.measureValue('moisture'),
      measure_ph: this.measureValue('ph'),
      measure_salinity: this.measureValue('salinity'),
      measure_temperature: this.measureValue('temperature'),
      status_light: this.measureStatus('light'),
      status_moisture: this.measureStatus('moisture'),
      status_nutrients: this.measureStatus('nutrients'),
      status_ph: this.measureStatus('ph'),
      status_salinity: this.measureStatus('salinity'),
      status_temperature: this.measureStatus('temperature'),
    }).filter(([_, v]) => v || typeof v === 'boolean'));
  }

  /**
   * Return device data.
   *
   * @return {Object}
   */
  get data() {
    if (!this.valid) return {};

    return {
      name: this.nickname,
      data: {
        id: this.id,
      },
      settings: this.settings,
    };
  }

  /**
   * Return device settings.
   *
   * @return {Object}
   */
  get settings() {
    if (!this.valid) return {};

    return {
      scientific_name: this.scientific_name || '-',
      sensor_version: this.sensor_version || '-',
    };
  }

  /**
   * Return whether device is valid.
   *
   * @return {boolean}
   */
  get valid() {
    return filled(this.id) && filled(this.nickname);
  }

  /**
   * Get status of property from measurement.
   *
   * @param {Object} property
   * @return {string}
   */
  measureStatus(property) {
    if (!(property in this.measurements)) return 'unknown';

    const value = this.measurements[property]?.status || null;

    return value ? Status[value] : 'unknown';
  }

  /**
   * Get value of property from measurement.
   *
   * @param {Object} property
   * @return {number|null}
   */
  measureValue(property) {
    if (!(property in this.measurements)) return null;

    const field = property === 'ph' ? 'current' : 'currentFormatted';
    const value = this.measurements[property]?.values[field] || null;

    return value ? Number(value) : null;
  }

}

module.exports = Plant;
