var adapter;
var User = DS.Model.extend({
  firstName: DS.attr()
});

module('unit/ember-json-api-adapter - buildUrl', {
  setup: function() {
    DS._routes = Ember.create(null);
    adapter = DS.JsonApiAdapter.create();
  },
  tearDown: function() {
    DS._routes = Ember.create(null);
    Ember.run(adapter, 'destroy');
  }
});

test('basic', function(){
  equal(adapter.buildURL('user', 1), '/users/1');
});

test("simple replacement", function() {
  DS._routes["comment"] = "posts/comments/{id}";
  equal(adapter.buildURL('comment', 1), '/posts/comments/1');
});

// TODO, actually support this
// test("captured link", function() {
//   DS._routes["comment"] = "posts/{posts.id}/comments";
//   equal(adapter.buildURL('comment', 1), '/posts/2/comments/1');
// });
//
// test("exploding", function() {
//   DS._routes["comment"] = "comments/{posts.comments}";
//   equal(adapter.buildURL('comment', 1), '/posts/2/comments/1');
// });
