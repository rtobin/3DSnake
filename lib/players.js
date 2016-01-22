(function () {
  if (typeof CUBOA === "undefined") {
    window.CUBOA = {};
  }

  var HumanPlayer = CUBOA.HumanPlayer = function ( map, id ) {
    CUBOA.Snake.call( this, map, id );
  };

  var AIPlayer = CUBOA.AIPlayer = function ( map, id ) {
    CUBOA.Snake.call( this, map, id );
  };

  CUBOA.Util.inherits( HumanPlayer, CUBOA.Snake );
  CUBOA.Util.inherits( AIPlayer, CUBOA.Snake );


})();
