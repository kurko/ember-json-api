(function() {

  var get = Ember.get;
  var forEach = Ember.EnumerableUtils.forEach;

  DS.JsonApiSerializer = DS.JSONSerializer.extend({

    /**
     * Always return pluralized root name
     */
    rootForType: function(type) {
      var typeString = type.toString();

      Ember.assert("Your model must not be anonymous. It was " + type, typeString.charAt(0) !== '(');

      // use the last part of the name as the URL
      var parts = typeString.split(".");
      var name = parts[parts.length - 1];
      return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1).pluralize();
    },

    /**
     * Default to inflection.js for pluralization
     */
    pluralize: function(name) {
      var plurals = this.configurations.get('plurals');
      return (plurals && plurals[name]) || name.pluralize();
    },

    /**
     * Default to inflection.js for singularization
     */
    singularize: function(name) {
      var plurals = this.configurations.get('plurals');
      if (plurals) {
        for (var i in plurals) {
          if (plurals[i] === name) {
            return i;
          }
        }
      }
      return name.singularize();
    },

    /**
     * Proxy the extractMany method, since there are no singular records
     */
    extract: function() {
      this.extractMany.apply(this, arguments);
    },

    /**
     * Use "links" object for associations
     */
    extractBelongsTo: function(type, hash, key) {
      return hash.links ? hash.links[key] : null;
    },

    /**
     * Use "links" object for associations
     */
    extractHasMany: function(type, hash, key) {
      return hash.links ? hash.links[key] : null;
    },

    /**
     * Underscore key
     */
    extractAttribute: function(type, hash, attributeName) {
      var key = this._keyForAttributeName(type, attributeName);
      return hash[key.underscore()];
    },

    /**
     * Underscore key
     */
    addAttribute: function(hash, key, value) {
      hash[key.underscore()] = value;
    },

    /**
     * Use "links" object, remove option for embedded relation
     */
    addBelongsTo: function(hash, record, key, relationship) {
      var child = get(record, relationship.key);
      var id = get(child, 'id');

      hash.links = hash.links || {};

      if (relationship.options && relationship.options.polymorphic && !Ember.isNone(id)) {
        this.addBelongsToPolymorphic(hash, key, id, child.constructor);
      } else {
        hash.links[key] = this.serializeId(id);
      }
    },

    /**
     * Use "links" object
     */
    addHasMany: function(hash, record, key, relationship) {
      var type = record.constructor,
          name = relationship.key,
          serializedHasMany = [],
          includeType = (relationship.options && relationship.options.polymorphic),
          manyArray, embeddedType;

      // If the has-many is not embedded, there is nothing to do.
      embeddedType = this.embeddedType(type, name);
      if (embeddedType !== 'always') { return; }

      // Get the DS.ManyArray for the relationship off the record
      manyArray = get(record, name);

      // Build up the array of serialized records
      manyArray.forEach(function (record) {
        serializedHasMany.push(this.serialize(record, { includeId: true, includeType: includeType }));
      }, this);

      // Set the appropriate property of the serialized JSON to the
      // array of serialized embedded records
      hash.links = hash.links || {};
      hash.links[key] = serializedHasMany;
    }

  });

}).call(this);
