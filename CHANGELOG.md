## CHANGELOG

### 0.2.0

* ensures that both singular and plural root keys work. #30
* PUT for a single resource won't send array of resources. #30
* createRecord for a single resource won't POST array of resources. #30
* builds URLs with underscores (was building with camelCase before).
* a bunch of tests
