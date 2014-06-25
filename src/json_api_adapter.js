var get = Ember.get;

/**
 * Keep a record of routes to resources by type.
 */
DS._routes = {};

DS.JsonApiAdapter = DS.RESTAdapter.extend({

  defaultSerializer: 'DS/jsonApi',

  /**
   * Look up routes based on top-level links.
   */
  buildURL: function(type, id) {
    var route = DS._routes[type];
    if(!!route) {
      var url = [],
          host = get(this, 'host'),
          prefix = this.urlPrefix(),
          param = new RegExp('\{(.*?)\}', 'g');

      if (id) {
        if(route.match(param)) {
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
    return this._super(type, id);
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
    var data = {};
    data[this.pathForType(type.typeKey)] = [
      store.serializerFor(type.typeKey).serialize(record, {includeId: true})
    ];

    return this.ajax(this.buildURL(type.typeKey), "POST", {data: data});
  },

  /**
   * Cast individual record to array,
   * and match the root key to the route
   */
  updateRecord: function(store, type, record) {
    var data = {};
    data[this.pathForType(type.typeKey)] = [
      store.serializerFor(type.typeKey).serialize(record)
    ];

    var id = get(record, 'id');

    return this.ajax(this.buildURL(type.typeKey, id), "PUT", {data: data});
  },

  _tryParseErrorResponse:  function(responseText) {
    try {
      return response = Ember.$.parseJSON(responseText)
    } catch(e) {
      return "Something went wrong";
    }
  },
  ajaxError: function(jqXHR) {
    var error = this._super(jqXHR);
    var response;

    if (jqXHR && typeof jqXHR === 'object') {
      response = this._tryParseErrorResponse(jqXHR.responseText);
      errors = {};

      if (response &&
          typeof response === 'object' &&
          response.errors !== undefined) {

        Ember.A(Ember.keys(response.errors)).forEach(function(key) {
          errors[Ember.String.camelize(key)] =response.errors[key];
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
        data[root] = this.serialize(record, options);
      },


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
