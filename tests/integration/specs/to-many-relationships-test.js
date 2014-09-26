var get = Ember.get, set = Ember.set;
var env;
var responses, pretender;

module('integration/specs/to-one-relationships', {
  setup: function() {

    responses = {
      to_many: {
        'posts': {
          id: '1',
          title: 'Rails is Omakase',
          links: {
            'comments': ['2', '3']
          }
        },
        'linked': {
          'comments': [{
            'id': '2',
            'title': 'good article',
            'body': 'ideal for my startup'
          }, {
            'id': '3',
            'title': 'bad article',
            'body': "doesn't run Crysis"
          }]
        }
      }
    };

    env = setupStore(setModels());
    env.store.modelFor('post');
    env.store.modelFor('comment');
    env.store.modelFor('author');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownPretender();
  }
});

asyncTest('GET /posts/1 returns linked resources', function() {
  pretender = stubResponse('get', '/posts/1', responses.to_many);

  env.store.find('post', '1').then(function(record) {
    var comment1, comment2;
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');
    equal(record.get('comments.length'), 2, 'there are 2 comments');

    comment1 = record.get('comments').objectAt(0);
    comment2 = record.get('comments').objectAt(1);
    equal(comment1.get('title'), 'good article', 'comment1 title');
    equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');
    equal(comment2.get('title'), 'bad article', 'comment2 title');
    equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');
    start();
  });
});
