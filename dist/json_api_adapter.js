/*! 
 * ember-json-api
 * Built on 2013-09-17
 * http://github.com/daliwali/ember-json-api
 * Copyright (c) 2013 Dali Zheng
 */
(function() {
"use strict";
var get = Ember.get, isNone = Ember.isNone;

DS.JsonApiSerializer = DS.RESTSerializer.extend({

  /**
   * Patch the extractSingle method, since there are no singular records
   */
  extractSingle: function(store, primaryType, payload, recordId, requestType) {
    var primaryTypeName = primaryType.typeKey;
    var json = {};
    for(var key in payload) {
      var typeName = Ember.String.singularize(key);
      if(typeName === primaryTypeName && Ember.isArray(payload[key])) {
        json[typeName] = payload[key][0];
      } else {
        json[key] = payload[key];
      }
    }
    return this._super(store, primaryType, json, recordId, requestType);
  },

  /**
   * Flatten links
   */
  normalize: function(type, hash, prop) {
    var json = {};
    for(var key in hash) {
      if(key !== 'links') {
        json[key] = hash[key];
      } else if(typeof hash[key] === 'object') {
        for(var link in hash[key]) {
          json[link] = hash[key][link];
        }
      }
    }
    return this._super(type, json, prop);
  },

  // SERIALIZATION

  /**
   * Use "links" key, remove support for polymorphic type
   */
  serializeBelongsTo: function(record, json, relationship) {
    var key = relationship.key;

    var belongsTo = get(record, key);

    if (isNone(belongsTo)) { return; }

    json.links = json.links || {};
    json.links[key] = get(belongsTo, 'id');
  },

  /**
   * Use "links" key
   */
  serializeHasMany: function(record, json, relationship) {
    var key = relationship.key;

    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      json.links = json.links || {};
      json.links[key] = get(record, key).mapBy('id');
    }
  }

});

}).call(this);

(function() {
"use strict";
var get = Ember.get;

DS.JsonApiAdapter = DS.RESTAdapter.extend({

  defaultSerializer: 'DS/jsonApi',

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

}).call(this);
