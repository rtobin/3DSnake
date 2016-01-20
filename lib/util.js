(function () {
  if (typeof CUBOA === "undefined") {
    window.CUBOA = {};
  }

  var Util = CUBOA.Util = {};

  Util.inherits = function (ChildClass, BaseClass) {
    function Surrogate () { this.constructor = ChildClass };
    Surrogate.prototype = BaseClass.prototype;
    ChildClass.prototype = new Surrogate();
  };

  Util.getUnitVecFromObject = function ( object ) {
    var vec = new THREE.Vector3();
    vec.copy( object.position );
    vec.normalize();
    return vec;
  };

})();
