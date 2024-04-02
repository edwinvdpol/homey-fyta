'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

class Driver extends OAuth2Driver {

  /*
  | Driver events
  */

  // Driver initialized
  async onOAuth2Init() {
    this.log('Initialized');
  }

  // Driver destroyed
  async onUninit() {
    this.log('Destroyed');
  }

  /*
  | Pairing functions
  */

  // Pair devices
  async onPairListDevices({ oAuth2Client }) {
    this.log(`Pairing ${this.id}s...`);

    const devices = await oAuth2Client.getPlants();

    return devices.map((device) => this.getDeviceData(device)).filter((e) => e);
  }

  // Return data to create the device
  getDeviceData(device) {
    const data = {
      name: device.nickname,
      data: {
        id: device.id,
      },
      settings: {
        scientific_name: device.scientific_name,
        sensor_version: device.sensor.version,
      },
    };

    this.log('Device found', JSON.stringify(data));

    return data;
  }

}

module.exports = Driver;
