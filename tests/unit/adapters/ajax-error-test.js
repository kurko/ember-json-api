import JsonApiAdapter from 'ember-json-api/adapters/json-api';
import JsonApiSerializer from 'ember-json-api/serializers/json-api';
import setupStore from '../../helpers/setup-store';

var env, store, adapter, SuperUser;
var originalAjax, passedUrl, passedVerb, passedHash;

module('unit/ember-json-api-adapter - adapter', {
  setup: function() {
    SuperUser = DS.Model.extend();

    env = setupStore({
      superUser: SuperUser,
      adapter: JsonApiAdapter,
      serializer: JsonApiSerializer
    });

    store = env.store;
    adapter = env.adapter;

    passedUrl = passedVerb = passedHash = null;
  }
});

test('ajaxError - returns invalid error if 422 response', function() {
  var error = new DS.InvalidError({
    name: "can't be blank"
  });

  var jqXHR = {
    status: 422,
    responseText: JSON.stringify({
      errors: {
        name: "can't be blank"
      }
    })
  };

  equal(adapter.ajaxError(jqXHR), error.toString());
});

test('ajaxError - invalid error has camelized keys', function() {
  var error = new DS.InvalidError({
    firstName: "can't be blank"
  });

  var jqXHR = {
    status: 422,
    responseText: JSON.stringify({
      errors: {
        first_name: "can't be blank"
      }
    })
  };

  equal(adapter.ajaxError(jqXHR), error.toString());
});

test('ajaxError - returns ServerError error if not 422 response', function() {
  var error  = new JsonApiAdapter.ServerError(500, "Something went wrong");

  var jqXHR = {
    status: 500,
    responseText: "Something went wrong"
  };

  var actualError = adapter.ajaxError(jqXHR);

  equal(actualError.message, error.message);
  equal(actualError.status, error.status);
  equal(actualError.xhr , jqXHR);
});
