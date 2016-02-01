(function () {
  if (typeof CUBOA === "undefined") {
    window.CUBOA = {};
  }

  // Snake - Singly Linked List

  var Node = function ( locId ) {
    this.locId = locId;
    this.previous = null;
  };

  var Snake = CUBOA.Snake = function ( map, id ) {
    this.map = map;
    this.id = id;
    this.color = '#C0C0C0'; // default color is silver
    this.length = 0;
    this.head = null;
    this.tail = null;
    this.currentSide = null;
    this.sideNormalVec = new THREE.Vector3();

    this.locIds = {};
    this.nextMoveVecDelta = new THREE.Vector3( 0,1,0 );
    // this.prevMoveVecDelta = new THREE.Vector3( 0,1,0 );
    this.paused = false;
    this.turningDir = null;
    // this.addToFront( locId );
    this.isAlive = true;
    this.score = 0;
    this.growing = 3; // integer indicating nummber of segments to grow
  };

  Snake.DEAD_COLOR = '#000000';
  Snake.GROWTH = 3;
  Snake.DEAD_HTML = "<span style='color:red;position: relative;font-size: 27px;top: -4px;'>X</span>";

  Snake.prototype.addToFront = function ( locId ) {
    var segment = new Node( locId );
    this.occupyLocation( locId );

    if ( this.length ) {
      this.head.previous = segment;
      this.head = segment;
    } else {
      this.head = segment;
      this.tail = segment;
    }

    this.length ++;
  };

  Snake.prototype.removeFromEnd = function () {
    // this.locIds[ this.tail.locId ] = null;
    this.leaveLocation( this.tail.locId );
    this.tail = this.tail.previous;
    this.length --;
  };

  Snake.prototype.occupyLocation = function ( locId ) {
    this.locIds[ locId ] = true;
    this.map.makeLocationOccupied( locId, this.color );
  };

  Snake.prototype.leaveLocation = function ( locId ) {
    if ( this.map.locations[ locId ] )
    this.locIds[ locId ] = null;
    this.map.makeLocationVacant( locId );
  };

  Snake.prototype.occupiesLocation = function ( locId ) {
    // double exclamation in case undefined
    !!this.locIds[ locId ];
  };

  Snake.prototype.move = function () {
    if ( this.isAlive ) {
      var locId = this.getNextLocation();

      if ( this.length > 0 && this.map.locations[ locId ].isOccupied) {
        this.die();
      } else {
        if ( locId === this.map.rewardLocId ) {
          this.getReward();
        }
        this.addToFront( locId );

        if (! this.growing ) {
          this.removeFromEnd();
        } else {
          this.growing --;
        }
      }
    }
  };

  Snake.prototype.getReward = function () {
    this.score ++;
    this.growing = Snake.GROWTH;
    if ( CUBOA.Game.POOP ) {
      this.map.makeLocationBricked( this.head.locId, this.id );
    }
    // $("#player" + this.id + "-score-pts").val( this.score.toString() );
    $("#score-pts"+ this.id).val( this.score.toString() );

    this.map.placeReward();
  };

  Snake.prototype.updateDirection = function () {
    this.sideNormalVec.copy(CUBOA.Game.UNIT_VECS[ this.currentSide ]);
    switch ( this.turningDir ) {
      case 'left':
        this.nextMoveVecDelta.crossVectors( this.sideNormalVec , this.nextMoveVecDelta );
        break;
      case 'right':
        this.nextMoveVecDelta.crossVectors ( this.nextMoveVecDelta , this.sideNormalVec );
        break
      // case 'pause':
      //   if (this.paused) {
      //     $(".gameover")[0].style.display = "none";
      //     this.nextMoveVecDelta.copy( this.prevMoveVecDelta );
      //     this.paused = false;
      //   } else {
      //     this.prevMoveVecDelta.copy( this.nextMoveVecDelta );
      //     this.nextMoveVecDelta.multiplyScalar(0);
      //     this.paused = true;
      //   }
      //   break
    }
    this.turningDir = null;
  };

  Snake.prototype.getNextLocationDefault = function () {
    this.updateDirection();
    var side = CUBOA.Map.SIDE;
    var locId = this.head.locId;
    var xi = ( locId % side );
    var yi = Math.floor( ( locId / side ) % side );
    var zi = Math.floor( locId / ( side * side ) );

    if ( xi + this.nextMoveVecDelta.x >= side ) {
      this.nextMoveVecDelta.copy( CUBOA.Game.UNIT_VECS[ this.currentSide ]).multiplyScalar(-1);
      this.currentSide  = 'x';
    } else if ( xi + this.nextMoveVecDelta.x < 0 ) {
      this.nextMoveVecDelta.copy( CUBOA.Game.UNIT_VECS[ this.currentSide ]).multiplyScalar(-1);
      this.currentSide  = 'nx';
    } else if ( yi + this.nextMoveVecDelta.y >= side ) {
      this.nextMoveVecDelta.copy( CUBOA.Game.UNIT_VECS[ this.currentSide ]).multiplyScalar(-1);
      this.currentSide  = 'y';
    } else if ( yi + this.nextMoveVecDelta.y < 0 ) {
      this.nextMoveVecDelta.copy( CUBOA.Game.UNIT_VECS[ this.currentSide ]).multiplyScalar(-1);
      this.currentSide  = 'ny';
    } else if ( zi + this.nextMoveVecDelta.z >= side ) {
      this.nextMoveVecDelta.copy( CUBOA.Game.UNIT_VECS[ this.currentSide ]).multiplyScalar(-1);
      this.currentSide  = 'z';
    } else if ( zi + this.nextMoveVecDelta.z < 0 ) {
      this.nextMoveVecDelta.copy( CUBOA.Game.UNIT_VECS[ this.currentSide ]).multiplyScalar(-1);
      this.currentSide  = 'nz';
    }

    // only one element of arr is nonzero
    locId += this.nextMoveVecDelta.x; // x
    locId += this.nextMoveVecDelta.y * side;  // y
    locId += this.nextMoveVecDelta.z * side * side;  // z
    return locId;

  };

  Snake.prototype.die = function () {
    var node = this.tail;
    while ( node ) {
      this.map.makeLocationBricked( node.locId );
      node = node.previous
    }

    this.isAlive = false;
    $("#score-img"+ this.id).append( Snake.DEAD_HTML );

  };

})();
