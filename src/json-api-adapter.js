/* global Ember, DS */
var get = Ember.get;

/**
 * Keep a record of routes to resources by type.
 */

// null prototype in es5 browsers wont allow collisions with things on the
// global Object.prototype.
DS._routes = Ember.create(null);

DS.JsonApiAdapter = DS.RESTAdapter.extend({
  defaultSerializer: 'DS/jsonApi',

  contentType: 'application/vnd.api+json; charset=utf-8',
  accepts: 'application/vnd.api+json, application/json, text/javascript, */*; q=0.01',

  ajaxOptions: function(url, type, options) {
    var hash = this._super(url, type, options);
    if (hash.data && type !== 'GET') {
      hash.contentType = this.contentType;
    }
    // Does not work
    //hash.accepts = this.accepts;
    if(!hash.hasOwnProperty('headers')) { hash.headers = {}; }
    hash.headers.Accept = this.accepts;
    return hash;
  },

  getRoute: function(typeName, id/*, record */) {
    return DS._routes[typeName];
  },

  /**
   * Look up routes based on top-level links.
   */
  buildURL: function(typeName, id, snapshot, requestType) {
    // FIXME If there is a record, try and look up the self link
    // - Need to use the function from the serializer to build the self key
    // TODO: this basically only works in the simplest of scenarios
    var route = this.getRoute(typeName, id, snapshot);
    if(!route) {
      return this._super(typeName, id, snapshot, requestType);
    }

    var url = [];
    var host = get(this, 'host');
    var prefix = this.urlPrefix();
    var param = /\{(.*?)\}/g;

    if (id) {
      if (param.test(route)) {
        url.push(route.replace(param, id));
      } else {
        url.push(route);
      }
    } else {
      url.push(route.replace(param, ''));
    }

    if (prefix) { url.unshift(prefix); }

    url = url.join('/');
    if (!host && url) { url = '/' + url; }

    return url;
  },

  /**
   * Fix query URL.
   */
  findMany: function(store, type, ids, snapshots) {
    return this.ajax(this.buildURL(type.typeKey, ids.join(','), snapshots, 'findMany'), 'GET');
  },

  /**
   * Cast individual record to array,
   * and match the root key to the route
   */
  createRecord: function(store, type, snapshot) {
    var data = this._serializeData(store, type, snapshot);

    return this.ajax(this.buildURL(type.typeKey), 'POST', {
      data: data
    });
  },

  /**
   * Suppress additional API calls if the relationship was already loaded via an `included` section
   */
  findBelongsTo: function(store, snapshot, url, relationship) {
    var belongsTo = snapshot.belongsTo(relationship.key);
    var belongsToLoaded = belongsTo && !belongsTo.record.get('currentState.isEmpty');

    if(belongsToLoaded) { return; }

    return this._super(store, snapshot, url, relationship);
  },

  /**
   * Suppress additional API calls if the relationship was already loaded via an `included` section
   */
  findHasMany: function(store, snapshot, url, relationship) {
    var hasManyLoaded = snapshot.hasMany(relationship.key).filter(function(item) { return !item.record.get('currentState.isEmpty'); });

    if(get(hasManyLoaded, 'length')) {
      return new Ember.RSVP.Promise(function (resolve, reject) { reject(); });
    }

    return this._super(store, snapshot, url, relationship);
  },

  /**
   * Cast individual record to array,
   * and match the root key to the route
   */
  updateRecord: function(store, type, snapshot) {
    var data = this._serializeData(store, type, snapshot);
    var id = get(snapshot, 'id');

    return this.ajax(this.buildURL(type.typeKey, id, snapshot), 'PATCH', {
      data: data
    });
  },

  _serializeData: function(store, type, snapshot) {
    var serializer = store.serializerFor(type.typeKey);
    var fn = Ember.isArray(snapshot) ? 'serializeArray' : 'serialize';
    var json = {
      data: serializer[fn](snapshot, { includeId:true, type:type.typeKey })
    };

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

  pathForType: function(type) {
    var dasherized = Ember.String.dasherize(type);
    return Ember.String.pluralize(dasherized);
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
