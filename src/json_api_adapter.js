var get = Ember.get;

DS.JsonApiAdapter = DS.RESTAdapter.extend({

  defaultSerializer: 'DS/jsonApi',

  /**
   * Pluralize the type name
   */
  rootForType: function(type) {
    return Ember.String.pluralize(type);
  },

  /**
   * Fix query URL
   */
  findMany: function(store, type, ids, owner) {
    return this.ajax(this.buildURL(type.typeKey), 'GET', {data: {ids: ids.join(',')}});
  },

  /**
   * Cast individual record to array,
   * and pluralize the root key
   */
  createRecord: function(store, type, record) {
    var data = {};
    data[Ember.String.pluralize(type.typeKey)] = [
      store.serializerFor(type.typeKey).serialize(record, {includeId: true})
    ];

    return this.ajax(this.buildURL(type.typeKey), "POST", {data: data});
  },

  /**
   * Cast individual record to array,
   * and pluralize the root key
   */
  updateRecord: function(store, type, record) {
    var data = {};
    data[Ember.String.pluralize(type.typeKey)] = [
      store.serializerFor(type.typeKey).serialize(record)
    ];

    var id = get(record, 'id');

    return this.ajax(this.buildURL(type.typeKey, id), "PUT", {data: data});
  }

});
