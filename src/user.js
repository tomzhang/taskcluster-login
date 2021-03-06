import taskcluster from 'taskcluster-client'
import _ from 'lodash'
import assert from 'assert'

export default class User {
  constructor() {
    this._identity = null;
    this.roles = [];
  }

  get identity() {
    return this._identity;
  }

  set identity(identity) {
    assert(identity.split('/').length == 2,
        "identity must have exactly one '/' character");
    this._identity = identity;
    // always reset roles when changing identity
    this.roles = [];
  }

  get identityProviderId() {
    return this._identity.split('/', 2)[0];
  }

  get identityId() {
    return this._identity.split('/', 2)[1];
  }

  addRole(role) {
    if (this.roles.indexOf(role) === -1) {
      this.roles.push(role);
    }
  }

  scopes() {
    return this.roles.map(role => "assume:" + role);
  }

  createCredentials(options) {
    assert(options);
    let scopes = this.scopes();
    if (scopes.length === 0) {
      return null;
    }
    return taskcluster.createTemporaryCredentials({
      start: taskcluster.fromNow(options.startOffset),
      expiry: taskcluster.fromNow(options.expiry),
      scopes,
      credentials: options.credentials
    });
  }

  /** Serialize user to JSON */
  serialize() {
    return {
      version:  1,
      identity: this._identity,
      roles:    this.roles,
    };
  }

  /** Load user from JSON */
  static deserialize(data = {}) {
    let user = new User();
    if (data.version === 1) {
      user._identity = data.identity;
      user.roles = data.roles || [];
    }
    return user;
  }

  /** Get user from request */
  static get(req) {
    if (req.user instanceof User) {
      return req.user;
    }
    return new User();
  }
};
