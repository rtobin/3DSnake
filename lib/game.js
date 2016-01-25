(function () {
  if (typeof CUBOA === "undefined") {
    window.CUBOA = {};
  }

  var Game = CUBOA.Game = function () {
    this.input = null; // "left", "right", "pause", ...
    this.paused = true;
    this.clock = new THREE.Clock();

    // allows 6 players max ( one player per side )
    this.map = new CUBOA.Map();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
    this.scene = this.map.scene;
    // this.scene2 = this.map.scene2;
    this.group = this.map.group;
    this.rotationEuler = new THREE.Euler();
    this.prevRotationEuler = new THREE.Euler();
    this.rotationQuaternion = new THREE.Quaternion();
    this.tweening = false;
    this.nextLocUnitVec = new THREE.Vector3();
    this.renderer = new THREE.CSS3DRenderer();
    // this.renderer2 = new THREE.WebGLRenderer();
    this.currentLocId = null;
    this.players = [
                    new CUBOA.HumanPlayer( this.map, 0 ),
                    // new CUBOA.AIPlayer( this.map, 0, CUBOA.Util.AStar ),

                    new CUBOA.AIPlayer( this.map, 1, CUBOA.Util.AStar ),

                    new CUBOA.AIPlayer( this.map, 2, CUBOA.Util.AStar ),
                    new CUBOA.AIPlayer( this.map, 3, CUBOA.Util.AStar ),
                    // new CUBOA.AIPlayer( this.map, 4, CUBOA.Util.AStar ),
                    // new CUBOA.AIPlayer( this.map, 5, CUBOA.Util.AStar ),



    ];
    this.humanPlayers = this.players.filter( function(el) { return el.isHuman; } );

    this.numPlayers = this.players.length;
    this.won = false;
    this.timeIter = 0;
    this.stats = new Stats();
  };

  Game.WINNING_HTML_TEXT = "<h1>You Win</h1><p>You survived! Congrats!</p>"
  Game.LOSING_HTML_TEXT = "<h1>Game Over</h1><p>Thanks for playing!</p>"
  Game.WIDTH = window.innerWidth;
  Game.HEIGHT = window.innerHeight;
  Game.CAMERA_DISTANCE = 2500;
  Game.STEP_FRAMES = 40; // frames until step iteration
  Game.STEP_FRAMES_DELTA = 1;
  Game.ITER_RATIO = Game.STEP_FRAMES_DELTA / Game.STEP_FRAMES;
  Game.TWEEN_TIME = 200;
  Game.TWEEN_DELAY = 50;
  Game.KEYS = {
    37: 'left',
    39: 'right',
    32: 'pause'
  };
  Game.DIRECTIONS = ['x', 'y', 'z'];
  Game.UNIT_VECS = {
    'x': new THREE.Vector3( 1,0,0 ),
    'y': new THREE.Vector3( 0,1,0 ),
    'z': new THREE.Vector3( 0,0,1 ),
    'nx': new THREE.Vector3( -1,0,0 ),
    'ny': new THREE.Vector3( 0,-1,0 ),
    'nz': new THREE.Vector3( 0,0,-1 )
  };
  Game.PLAYER_COLORS = [
    '#C0C0C0', // silver
    '#EAC117', // golden brown
    '#FF0000', // red
    '#0000FF', // blue
    '#00FF00', // lime
    '#FF00FF'  // magenta
  ];
  Game.PLAYER_SIDES = ['z', 'x', 'nz', 'nx', 'y', 'ny'];
  Game.POOP = true;

  Game.prototype.init = function () {
    this.map.init( this.onMapLoad.bind( this ) );

    this.camera.position.z = Game.CAMERA_DISTANCE;
    $(document).keydown( this.onKeyDown.bind(this) );
    $(".play-pause-container").click( this.togglePause.bind(this) );

    for (var i = 0; i < this.humanPlayers.length; i++ ) {
      var player = this.humanPlayers[i];
      $(".left-arrow-btn").click( function() {  player.turningDir = 'left'; });
      $(".right-arrow-btn").click( function() { player.turningDir = 'right'; });

    }

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.domElement.style.position = 'absolute';


    document.getElementById( 'game-window' ).appendChild( this.renderer.domElement );

    // this.renderer2.setClearColor( 0xffffff );
    // this.renderer2.setPixelRatio( window.devicePixelRatio );
    // this.renderer2.setSize( window.innerWidth, window.innerHeight );
    // document.getElementById( 'game-window' ).appendChild( this.renderer2.domElement );

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.top = '0px';
    document.getElementById( 'game-window' ).appendChild( this.stats.domElement );

    window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
    // $("#reset-button").click(this.resetGame);
  };

  Game.prototype.onMapLoad = function () {
    var that = this;
    // place players in their initial location
    this.players.forEach( function ( player, id ) {
      player.color = Game.PLAYER_COLORS[ id ];

      var html = "<li>";
      html += "<div id='score-img" + id + "' style='display:inline-block;height:20px;width:20px;' >"
      html += "<img src='images/sprite.png' style='height:20px;display:inline-block;position:absolute; ";
      html += "border-radius:100px;background:" + player.color + ";'>";
      html += "</div>";
      html += "<input type='text' value='0' readonly='true'";
      html += "id='score-pts" + id +"'";
      html += "style='display:inline-block;font-size:12px;width:25px;border:0;' />";
      html += "</li>";
      $(".score-list").append(html);

      var startLocVec = new THREE.Vector3();
      player.currentSide = Game.PLAYER_SIDES[id];
      startLocVec.copy( Game.UNIT_VECS[ player.currentSide ] );

      var sideHalf = Math.floor( CUBOA.Map.SIDE / 2 );
      var locId = ( startLocVec.x + 1 ) * sideHalf;
      locId += ( startLocVec.y + 1 ) * sideHalf * CUBOA.Map.SIDE;
      locId += ( startLocVec.z + 1 ) * sideHalf * CUBOA.Map.SIDE * CUBOA.Map.SIDE;
      player.addToFront( locId )

      if ( ! player.isHuman ) {
        player.graph.init( that.map.locIds );
      }
    })

    this.currentLocId = this.players[0].head.locId;
  };

  Game.prototype.tweenRotate = function () {
    var nextLocId = this.players[0].head.locId;
    this.tweening = true;
    this.nextLocUnitVec.setFromMatrixPosition( this.map.locations[ nextLocId].matrixWorld );
    this.nextLocUnitVec.normalize();
    this.rotationQuaternion.setFromUnitVectors( Game.UNIT_VECS['z'], this.nextLocUnitVec );
    this.rotationEuler.setFromQuaternion( this.rotationQuaternion );
    this.prevRotationEuler.copy( this.group.rotation );

    var that = this;
    new TWEEN.Tween( this.group.rotation )
    .to( {
      x: this.prevRotationEuler.x - this.rotationEuler.x,
      y: this.prevRotationEuler.y - this.rotationEuler.y,
      z: this.prevRotationEuler.z - this.rotationEuler.z }, Game.TWEEN_TIME )
    .delay( Game.TWEEN_DELAY )
    .easing( TWEEN.Easing.Linear.None )
    .onComplete( function () {
      that.tweening = false;
      // console.log('done tweening');
    })
    .start();
  };


  Game.prototype.onKeyDown = function (e) {
    switch ( Game.KEYS[e.keyCode] ) {
      case 'left':
        for (var i = 0; i < this.humanPlayers.length; i++ ) {
          this.humanPlayers[i].turningDir = 'left';
        }
        break
      case 'right':
      for (var i = 0; i < this.humanPlayers.length; i++ ) {
        this.humanPlayers[i].turningDir = 'right';
      }
        break
      case 'pause':
        this.togglePause();
        break
    }
  };

  Game.prototype.togglePause = function () {
    if ( ! this.paused ) {
      // $(".instructions").css("display", "block");
      $(".play-pause").addClass("play");
      this.paused = true;
      this.players.forEach( function ( player ) {
        player.turningDir = null;
      })
      if ( ! this.players[0].isAlive ) {
        $(".gameover")[0].style.display = "block";
      }
    } else {
      $(".gameover")[0].style.display = "none";
      // $(".instructions").css("display", "none");
      $(".play-pause").removeClass("play");
      this.paused = false;
    }
  };

  Game.prototype.onWindowResize = function () {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    // this.renderer2.setSize( window.innerWidth, window.innerHeight );
  };

  Game.prototype.isOccupied = function ( locId ) {
    return !!this.map.locations[ locId ].isOccupied;
  };

  Game.prototype.anyRemaingOpponents = function () {
    for ( var i = 1; i < this.numPlayers; i ++) {
      if ( this.players[i].isAlive ) {
        return true;
      }
    }

    return false;
  };

  Game.prototype.playMoves = function () {
    if ( ! this.anyRemaingOpponents() && this.numPlayers > 1) {
      this.won = true;
      $(".gameover").html( Game.WINNING_HTML_TEXT );
      $(".gameover")[0].style.display = "block";

    } else {
      this.players.forEach( function ( player ) {
        player.move();
      })
    }
  };

  Game.prototype.animate = function () {
    requestAnimationFrame( this.animate.bind(this) );

    TWEEN.update();
    // this.scene2.rotation.x += 0.001;
    // this.scene2.rotation.z += 0.001;

    if ( ! this.paused ) {
      if ( this.players[0].isAlive) {
        if ( ! this.tweening ) {
          this.playMoves();
          this.map.updateRewardOpacity( this.players[0].head.locId );
          this.tweenRotate();
        } else {
        }
      } else {
        $(".gameover").html( Game.LOSING_HTML_TEXT );
        $(".gameover")[0].style.display = "block";
      }
    }
    // if ( ! this.paused && this.eulerRotation ) {
    //   this.timeIter += Game.STEP_FRAMES_DELTA;
    //   if ( this.timeIter > Game.STEP_FRAMES ) {
    //     this.playMoves();
    //     this.setEulerRotation();
    //     this.timeIter = 0;
    //   } else if ( this.players[0].length > 0 ) {
    //     this.applyEulerRotation();
    //   }
    // }

    this.renderer.render( this.scene, this.camera );
    // this.renderer2.render( this.scene2, this.camera );
    this.stats.update();
  };

})();
