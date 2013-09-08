var get = Ember.get, isNone = Ember.isNone;

DS.JsonApiSerializer = DS.RESTSerializer.extend({

  /**
   * Patch the extractSingle method, since there are no singular records
   */
  extractSingle: function(store, primaryType, payload, recordId, requestType) {
    var primaryTypeName = primaryType.typeKey;
    var json = {};
    for(var key in payload) {
      var typeName = this.singularize(key);
      if(typeName == primaryTypeName && Ember.isArray(payload[key])) {
        json[typeName] = payload[key][0];
      } else {
        json[key] == payload[key];
      }
    }
    return this._super(store, primaryType, json, recordId, requestType);
  },

  /**
   * Flatten links, camelize keys
   */
  normalize: function(type, hash, prop) {
    var json = {};
    for(var key in hash) {
      if(key != 'links') {
        json[Ember.String.camelize(key)] = hash[key];
      } else if(typeof hash[key] == 'object') {
        for(var link in hash[key]) {
          json[Ember.String.camelize(link)] = hash[key][link];
        }
      }
    }
    return this._super(type, prop, json);
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
