var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/compound-documents', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_compound_document: {
        posts: {
          id: '1',
          title: 'Rails is Omakase',
          links: {
            comments: ['2', '3'],
            author: '4'
          }
        },
        linked: {
          comments: [{
            id: '2',
            title: 'good article',
            body: 'ideal for my startup'
          }, {
            id: '3',
            title: 'bad article',
            body: "doesn't run Crysis"
          }],
          authors: [{
            id: '4',
            name: 'dhh'
          }]
        }
      }
    };

    env = setupStore(setModels());
    env.store.modelFor('post');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('Post with sync comments uses linked resources', function() {
  var models = setModels({
    commentAsync: false,
    authorAsync: false
  });
  env = setupStore(models);

  fakeServer.get('/posts/1', responses.posts_compound_document);

  env.store.find('post', '1').then(function(record) {
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');

    var comments = record.get('comments');
    var author   = record.get('author');
    var comment1 = comments.objectAt(0);
    var comment2 = comments.objectAt(1);

    equal(comments.get('length'), 2, 'there are 2 comments');

    equal(comment1.get('title'), 'good article', 'comment1 title');
    equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');
    equal(comment2.get('title'), 'bad article', 'comment2 title');
    equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');
    equal(author.get('id'), '4', 'author id');
    equal(author.get('name'), 'dhh', 'author name');
    start();
  });
});

asyncTest('Post with async comments uses linked resources', function() {
  var models = setModels({
    commentAsync: true,
    authorAsync: true
  });
  env = setupStore(models);

  fakeServer.get('/posts/1', responses.posts_compound_document);

  env.store.find('post', '1').then(function(record) {
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');

    record.get('comments').then(function(comments) {
      var comment1 = comments.objectAt(0);
      var comment2 = comments.objectAt(1);

      equal(comments.get('length'), 2, 'there are 2 comments');

      equal(comment1.get('title'), 'good article', 'comment1 title');
      equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');
      equal(comment2.get('title'), 'bad article', 'comment2 title');
      equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');
      return record.get('author')
    }).then(function(author) {
      equal(author.get('id'), '4', 'author id');
      equal(author.get('name'), 'dhh', 'author name');
      start();
    });
  });
});
