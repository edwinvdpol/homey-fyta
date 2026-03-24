'use strict';

const { clean } = require('./Utils');
const { Status } = require('./Enums');

class Data {

  constructor(raw) {
    Object.assign(this, clean(this.fromApiData(raw)));
  }

  get active() {
    return this.status !== 0;
  }

  get device() {
    if (!this.valid) return {};

    return {
      name: this.name,
      data: { id: this.id },
      settings: this.settings,
    };
  }

  get settings() {
    return {
      scientific_name: this.scientific_name || '-',
      sensor_version: this.sensor_version || '-',
    };
  }

  get valid() {
    return this.id && this.active && this.has_sensor;
  }

  fromApiData(raw) {
    const data = {};

    if ('id' in raw) data.id = raw.id;
    if ('measurements' in raw) {
      let msts = raw.measurements;
      if ('battery' in msts) data.measure_battery = Number(msts.battery);
      if ('light' in msts) data.measure_light = this.measureValue('light', msts);
      if ('light' in msts) data.status_light = this.measureStatus('light', msts);
      if ('moisture' in msts) data.measure_moisture = this.measureValue('moisture', msts);
      if ('moisture' in msts) data.status_moisture = this.measureStatus('moisture', msts);
      if ('nutrients' in msts) data.status_nutrients = this.measureStatus('nutrients', msts);
      if ('ph' in msts) data.measure_ph = this.measureValue('ph', msts);
      if ('ph' in msts) data.status_ph = this.measureStatus('ph', msts);
      if ('salinity' in msts) data.measure_salinity = this.measureValue('salinity', msts);
      if ('salinity' in msts) data.status_salinity = this.measureStatus('salinity', msts);
      if ('temperature' in msts) data.measure_temperature = this.measureValue('temperature', msts);
      if ('temperature' in msts) data.status_temperature = this.measureStatus('temperature', msts);
      msts = null;
    }
    if ('nickname' in raw) data.name = raw.nickname;
    if ('scientific_name' in raw) data.scientific_name = raw.scientific_name;
    if ('sensor' in raw) {
      if ('has_sensor' in raw.sensor) data.has_sensor = raw.sensor.has_sensor;
      if ('version' in raw.sensor) data.sensor_version = raw.sensor.version;
    }
    if ('status' in raw) data.status = raw.status;

    return data;
  }

  measureStatus(property, measurements) {
    const value = measurements[property]?.status || null;

    return value ? Status[value] : 'unknown';
  }

  measureValue(property, measurements) {
    const field = property === 'ph' ? 'current' : 'currentFormatted';
    const value = measurements[property]?.values[field] || null;

    return value ? Number(value) : null;
  }

}

module.exports = Data;
