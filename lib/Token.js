'use strict';

const { OAuth2Token } = require('homey-oauth2app');

class Token extends OAuth2Token {

  constructor({
    username, password, ...props
  }) {
    super({ ...props });

    this.username = username || null;
    this.password = password || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      username: this.username,
      password: this.password,
    };
  }

}

module.exports = Token;
