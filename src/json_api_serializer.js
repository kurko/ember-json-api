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
   * Convert attribute key to underscore
   */
  serializeAttribute: function(record, json, key, attribute) {
    var attrs = get(this, 'attrs');
    var value = get(record, key), type = attribute.type;

    if(type) {
      var transform = this.transformFor(type);
      value = transform.serialize(value);
    }

    // if provided, use the mapping provided by `attrs` in
    // the serializer
    key = attrs && attrs[key] || key;

    json[Ember.String.underscore(key)] = value;
  },

  /**
   * Use "links" key, convert key to underscore, remove support for polymorphic type
   */
  serializeBelongsTo: function(record, json, relationship) {
    var key = relationship.key;

    var belongsTo = get(record, key);

    if (isNone(belongsTo)) { return; }

    json.links = json.links || {};
    json.links[Ember.String.underscore(key)] = get(belongsTo, 'id');
  },

  /**
   * Use "links" key, convert key to underscore
   */
  serializeHasMany: function(record, json, relationship) {
    var key = relationship.key;

    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      json.links = json.links || {};
      json.links[Ember.String.underscore(key)] = get(record, key).mapBy('id');
    }
  }

});
