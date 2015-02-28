var get = Ember.get;

/**
 * Keep a record of routes to resources by type.
 */

// null prototype in es5 browsers wont allow collisions with things on the
// global Object.prototype.
DS._routes = Ember.create(null);

DS.JsonApiAdapter = DS.RESTAdapter.extend({
  defaultSerializer: 'DS/jsonApi',
  /**
   * Look up routes based on top-level links.
   */
  buildURL: function(typeName, id) {
    // TODO: this basically only works in the simplest of scenarios
    var route = DS._routes[typeName];
    if (!!route) {
      var url = [];
      var host = get(this, 'host');
      var prefix = this.urlPrefix();
      var param = /\{(.*?)\}/g;

      if (id) {
        if (param.test(route)) {
          url.push(route.replace(param, id));
        } else {
          url.push(route, id);
        }
      } else {
        url.push(route.replace(param, ''));
      }

      if (prefix) { url.unshift(prefix); }

      url = url.join('/');
      if (!host && url) { url = '/' + url; }

      return url;
    }

    return this._super(typeName, id);
  },

  /**
   * Fix query URL.
   */
  findMany: function(store, type, ids, owner) {
    return this.ajax(this.buildURL(type.typeKey, ids.join(',')), 'GET');
  },

  /**
   * Cast individual record to array,
   * and match the root key to the route
   */
  createRecord: function(store, type, record) {
    var data = this._serializeData(store, type, record);

    return this.ajax(this.buildURL(type.typeKey), 'POST', {
      data: data
    });
  },

  /**
   * Cast individual record to array,
   * and match the root key to the route
   */
  updateRecord: function(store, type, record) {
    var data = this._serializeData(store, type, record),
      id = get(record, 'id');

    return this.ajax(this.buildURL(type.typeKey, id), 'PUT', {
      data: data
    });
  },

  _serializeData: function(store, type, record) {
    var serializer = store.serializerFor(type.typeKey),
      snapshot = record._createSnapshot(),
      pluralType = Ember.String.pluralize(type.typeKey),
      json = {};

    json.data = serializer.serialize(snapshot, { includeId: true });
    if(!json.data.hasOwnProperty('type')) {
      json.data.type = pluralType;
    }
    return json;
  },

  _tryParseErrorResponse:  function(responseText) {
    try {
      return Ember.$.parseJSON(responseText);
    } catch(e) {
      return "Something went wrong";
    }
  },

  ajaxError: function(jqXHR) {
    var error = this._super(jqXHR);
    var response;

    if (jqXHR && typeof jqXHR === 'object') {
      response = this._tryParseErrorResponse(jqXHR.responseText);
      var errors = {};

      if (response &&
          typeof response === 'object' &&
            response.errors !== undefined) {

        Ember.A(Ember.keys(response.errors)).forEach(function(key) {
          errors[Ember.String.camelize(key)] = response.errors[key];
        });
      }

      if (jqXHR.status === 422) {
        return new DS.InvalidError(errors);
      } else{
        return new ServerError(jqXHR.status, response, jqXHR);
      }
    } else {
      return error;
    }
  },
  /**
    Underscores the JSON root keys when serializing.

    @method serializeIntoHash
    @param {Object} hash
    @param {subclass of DS.Model} type
    @param {DS.Model} record
    @param {Object} options
    */
  serializeIntoHash: function(data, type, record, options) {
    var root = underscore(decamelize(type.typeKey));
    var snapshot = record._createSnapshot();
    data[root] = this.serialize(snapshot, options);
  },

  pathForType: function(type) {
    var decamelized = Ember.String.decamelize(type);
    return Ember.String.pluralize(decamelized);
  }
});

function ServerError(status, message, xhr) {
  this.status = status;
  this.message = message;
  this.xhr = xhr;

  this.stack = new Error().stack;
}

ServerError.prototype = Ember.create(Error.prototype);
ServerError.constructor = ServerError;

DS.JsonApiAdapter.ServerError = ServerError;

export default DS.JsonApiAdapter;
