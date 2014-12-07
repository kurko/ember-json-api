var get = Ember.get;
var isNone = Ember.isNone;

DS.JsonApiSerializer = DS.RESTSerializer.extend({
  keyForRelationship: function(key) {
    return key;
  },
  /**
   * Patch the extractSingle method, since there are no singular records
   */
  extractSingle: function(store, primaryType, payload, recordId, requestType) {
    var primaryTypeName;
    if (this.keyForAttribute) {
      primaryTypeName = this.keyForAttribute(primaryType.typeKey);
    } else {
      primaryTypeName = primaryType.typeKey;
    }

    var json = {};

    for (var key in payload) {
      var typeName = Ember.String.singularize(key);
      if (typeName === primaryTypeName &&
          Ember.isArray(payload[key])) {
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
    for (var key in hash) {
      if (key !== 'links') {
        json[key] = hash[key];
      } else if (typeof hash[key] === 'object') {
        for (var link in hash[key]) {
          var linkValue = hash[key][link];
          if (linkValue && typeof linkValue === 'object' && linkValue.href) {
            json.links = json.links || {};
            json.links[link] = linkValue.href;
          } else if (linkValue && typeof linkValue === 'object' && linkValue.ids) {
            json[link] = linkValue.ids;
          } else {
            json[link] = linkValue;
          }
        }
      }
    }
    return this._super(type, json, prop);
  },

  /**
   * Extract top-level "meta" & "links" before normalizing.
   */
  normalizePayload: function(payload) {
    if (payload.meta) {
      this.extractMeta(payload.meta);
      delete payload.meta;
    }
    if (payload.links) {
      this.extractLinks(payload.links);
      delete payload.links;
    }
    if (payload.linked) {
      this.extractLinked(payload.linked);
      delete payload.linked;
    }
    return payload;
  },

  /**
   * Extract top-level "linked" containing associated objects
   */
  extractLinked: function(linked) {
    var link, values, value, relation;
    var store = get(this, 'store');

    for (link in linked) {
      values = linked[link];
      for (var i = values.length - 1; i >= 0; i--) {
        value = values[i];

        if (value.links) {
          for (relation in value.links) {
            value[relation] = value.links[relation];
          }
          delete value.links;
        }
      }
    }
    store.pushPayload(linked);
  },

  /**
   * Override this method to parse the top-level "meta" object per type.
   */
  extractMeta: function(meta) {
    // no op
  },

  /**
   * Parse the top-level "links" object.
   */
  extractLinks: function(links) {
    var link, key, value, route;
    var extracted = [], linkEntry, linkKey;

    for (link in links) {
      key = link.split('.').pop();
      value = links[link];
      if (typeof value === 'string') {
        route = value;
      } else {
        key = value.type || key;
        route = value.href;
      }

      // strip base url
      if (route.substr(0, 4).toLowerCase() === 'http') {
        route = route.split('//').pop().split('/').slice(1).join('/');
      }

      // strip prefix slash
      if (route.charAt(0) === '/') {
        route = route.substr(1);
      }
      linkEntry = { };
      linkKey = Ember.String.singularize(key);
      linkEntry[linkKey] = route;
      extracted.push(linkEntry);
      DS._routes[linkKey] = route;
    }
    return extracted;
  },

  // SERIALIZATION

  /**
   * Use "links" key, remove support for polymorphic type
   */
  serializeBelongsTo: function(record, json, relationship) {
    var attr = relationship.key;
    var belongsTo = get(record, attr);
    if (isNone(belongsTo)) return;

    var type = this.keyForRelationship(belongsTo.constructor.typeKey);
    var key = this.keyForRelationship(attr);

    json.links = json.links || {};
    json.links[key] = belongsToLink(key, type, get(belongsTo, 'id'));
  },

  /**
   * Use "links" key
   */
  serializeHasMany: function(record, json, relationship) {
    var attr = relationship.key;
    var type = this.keyForRelationship(relationship.type.typeKey);
    var key = this.keyForRelationship(attr);

    if (relationship.kind === 'hasMany') {
      json.links = json.links || {};
      json.links[key] = hasManyLink(key, type, record, attr);
    }
  }
});

function belongsToLink(key, type, value) {
  var link = value;
  if (link && key !== type) {
    link = {
      id: link,
      type: type
    };
  }
  return link;
}

function hasManyLink(key, type, record, attr) {
  var link = get(record, attr).mapBy('id');
  if (link && key !== Ember.String.pluralize(type)) {
    link = {
      ids: link,
      type: type
    };
  }
  return link;
}

export default DS.JsonApiSerializer;
