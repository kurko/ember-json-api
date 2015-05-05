## CHANGELOG

### 0.4.4

* Made dasherized the default naming convention for resource types, attribute names, and association names per [recommended naming conventions](http://jsonapi.org/recommendations/#naming). To override with camelCase or snake_case, override the following:

```
export default JsonApiSerializer.extend({
  keyForAttribute: function(key) {
    return Ember.String.camelize(key);
  },
  keyForRelationship: function(key) {
    return Ember.String.camelize(key);
  },
  keyForSnapshot: function(snapshot) {
    return Ember.String.camelize(snapshot.typeKey);
  }
});
```

* Made dasherized the default naming convention for path types. To change, override

```
export default JsonApiAdapter.extend({
  pathForType: function(type) {
    var decamelized = Ember.String.decamelize(type);
    return Ember.String.pluralize(decamelized);
  }
});
```

### 0.4.3

* Replace PUT verb with PATCH. This is a breaking change for some and can be overridden in the application adapter with the following:
 
```
    ajaxOptions: function(url, type, options) {
        var methodType = (type === 'PATCH') ? 'PUT' : type;
        return this._super(url, methodType, options);
    }
```

### 0.4.2

* updating to [JSON API RC3](https://github.com/json-api/json-api/blob/827ba3c1130408fdb406d9faab645b0db7dd4fe4/index.md) with the usage of the consistent linkage format.
* Added polymorphic support.

### 0.4.1

* keeping up with JSON API RC2+ to change linked to included and resource to related.

### 0.4.0

* updating to JSON API RC2

### 0.3.0

* removes deprecation warning because of DS' snapshots
* stops overriding `extractMeta`
* FIX: inside a serializer, reuses the same current store instead of relying on
  defaultSerializer. This is a fix for apps that use multiple stores.
* FIX: covers null associations
* BREAKING: all keys are camelized, so now define your camelize your model
  attributes
* BREAKING: Ember 1.0.0-beta.15 support

### 0.2.0

* ensures that both singular and plural root keys work. #30
* PUT for a single resource won't send array of resources. #30
* createRecord for a single resource won't POST array of resources. #30
* builds URLs with underscores (was building with camelCase before).
* a bunch of tests
