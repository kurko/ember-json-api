## CHANGELOG

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
