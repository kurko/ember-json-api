var Owner, Pet, Cat, Dog;

function setPolymorphicModels() {
  Owner = DS.Model.extend({
    name: DS.attr('string'),
    pets: DS.hasMany('pets', {polymorphic: true})
  });

  Pet = DS.Model.extend({
    paws: DS.attr('number')
  });

  Cat = Pet.extend({
    whiskers: DS.attr('number')
  });

  Dog = Pet.extend({
    spots: DS.attr('number')
  });

  return {
    'owner': Owner,
    'pet': Pet,
    'cat': Cat,
    'dog': Dog
  };
}
