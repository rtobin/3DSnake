(function () {
  if (typeof CUBOA === "undefined") {
    window.CUBOA = {};
  }

  var HumanPlayer = CUBOA.HumanPlayer = function ( map, id ) {
    CUBOA.Snake.call( this, map, id );

    this.isHuman = true;
  };

  CUBOA.Util.inherits( HumanPlayer, CUBOA.Snake );

  HumanPlayer.prototype.getNextLocation = function () {
    return this.getNextLocationDefault();
  };

  /////

  var AIPlayer = CUBOA.AIPlayer = function ( map, id, algorithm ) {
    CUBOA.Snake.call( this, map, id );

    this.isHuman = false;
    this.algorithm = algorithm;
    this.graph = new CUBOA.Util.Graph( this.algorithm.resetNode );
  };

  CUBOA.Util.inherits( AIPlayer, CUBOA.Snake );

  AIPlayer.prototype.getNextLocation = function () {
    var start = this.graph.nodes[ this.head.locId ];
    var end = this.graph.nodes[ this.map.rewardLocId ];

    var that = this;
    var options = {
      isWallFunc: function ( locId ) {
        return that.map.locations[ locId ].isOccupied;
      }
    };
    var nextNode = this.algorithm.search( this.graph, start, end, options )
    if ( nextNode ) {
      return nextNode.id;
    } else {
      return this.getNextLocationDefault();
    }
  };


})();
