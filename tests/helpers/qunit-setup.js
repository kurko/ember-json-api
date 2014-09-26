QUnit.pending = function() {
  QUnit.test(arguments[0] + ' (SKIPPED)', function() {
    var li = document.getElementById(QUnit.config.current.id);
    QUnit.done(function() {
      li.style.background = '#FFFF99';
    });
    ok(true);
  });
};
pending = QUnit.pending;
QUnit.skip = QUnit.pending;
skip = QUnit.pending;
