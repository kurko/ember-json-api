var Post, Comment, Author;

function setModels() {
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

  return {
    'post': Post,
    'author': Author,
    'comment': Comment
  }
}
