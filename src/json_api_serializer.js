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

  /**
   * Extract top-level "meta" & "links" before normalizing.
   */
  normalizePayload: function(type, payload) {
    if(payload.meta) {
      this.extractMeta(type, payload.meta);
      delete payload.meta;
    }
    if(payload.links) {
      this.extractLinks(type, payload.links);
      delete payload.links;
    }
    if(payload.linked) {
      this.extractLinked(payload.linked);
      delete payload.linked;
    }
    return payload;
  },

  /**
   * Extract top-level "linked" containing associated objects
   */
  extractLinked: function(linked) {
    var link, values, value, relation, store = get(this, 'store');
    for(link in linked) {
      values = linked[link];
      for (var i = values.length - 1; i >= 0; i--) {
        value = values[i];

        if (value.links) {
          for(relation in value.links) {
            value[relation] = value.links[relation];
          }
          delete value.links;
        }
        // console.log(value);
        store.push(Ember.String.singularize(link), value);
      }
    }
  },

  /**
   * Override this method to parse the top-level "meta" object per type.
   */
  extractMeta: function(type, meta) {
    // no op
  },

  /**
   * Parse the top-level "links" object.
   */
  extractLinks: function(type, links) {
    var link, key, value, route;

    for(link in links) {
      key = link.split('.').pop();
      value = links[link];
      if(typeof value === 'string') {
        route = value;
      } else {
        key = value.type || key;
        route = value.href;
      }

      // strip base url
      if(route.substr(0, 4).toLowerCase() === 'http') {
        route = route.split('//').pop().split('/').slice(1).join('/');
      }

      // strip prefix slash
      if(route.charAt(0) === '/') {
        route = route.substr(1);
      }

      DS.set('_routes.' + Ember.String.singularize(key), route);
    }
  },

  // SERIALIZATION

  /**
   * Use "links" key, remove support for polymorphic type
   */
  serializeBelongsTo: function(record, json, relationship) {
    var key = relationship.key;
    var belongsTo = get(record, key);

    if (isNone(belongsTo)) return;

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
