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
  }

});
