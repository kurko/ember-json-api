//var stubResponse = require('tests/helpers/pretender');

var get = Ember.get, set = Ember.set;
var Post, Comment, Author, env;
var pretender;

var RESPONSE = {
  lone_post: {
    'posts': {
      id: '1',
      title: 'Rails is Omakase'
    }
  },
  posts_list: {
    'posts': [{
      id: '1',
      title: 'Rails is Omakase'
    }, {
      id: '2',
      title: 'Ember.js Handlebars'
    }]
  }
};

module('integration/get-specs', {
  setup: function() {

    Post = DS.Model.extend({
      title:    DS.attr('string'),
      comments: DS.hasMany('comment'),
      author:   DS.belongsTo('author')
    });

    Author = DS.Model.extend({
      name: DS.attr('string')
    });

    Comment = DS.Model.extend({
      title: DS.attr('string'),
      body:  DS.attr('string')
    });

    env = setupStore({
      post:    Post,
      comment: Comment,
      author:  Author
    });

    env.store.modelFor('post');
    env.store.modelFor('comment');
    env.store.modelFor('author');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownPretender();
  }
});

asyncTest('/posts', function() {
  pretender = stubResponse('get', '/posts', RESPONSE.posts_list);

  env.store.find('post').then(function(record) {
    var post1 = record.get("firstObject"),
        post2 = record.get("lastObject");

    equal(post1.get('id'), '1', 'id is correct');
    equal(post1.get('title'), 'Rails is Omakase', 'title is correct');

    equal(post2.get('id'), '2', 'id is correct');
    equal(post2.get('title'), 'Ember.js Handlebars', 'title is correct');
    start();
  });
});

asyncTest('/posts/1 with single resource', function() {
  pretender = stubResponse('get', '/posts/1', RESPONSE.lone_post);

  env.store.find('post', '1').then(function(record) {
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');
    start();
  });
});
