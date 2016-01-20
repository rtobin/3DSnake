(function () {
  if (typeof CUBOA === "undefined") {
    window.CUBOA = {};
  }

  var Map = CUBOA.Map = function () {
    this.sphereImage = document.createElement( 'img' );
    this.rewardImage = document.createElement( 'img' );
    this.scene = new THREE.Scene();
    this.scene2 = new THREE.Scene();
    this.group = new THREE.Object3D();
    this.locIds = []; // array of integers that uniquely identify each point on the surface
    this.locations = {}; // locations[ <locId> ] = <actual sphere element>
  };

  Map.SIDE = 15;
  Map.SEPARATION = 150;
  Map.CUBIC_VOLUME = Math.pow( Map.SIDE, 3 );
  Map.CUBIC_SURFACE = Map.CUBIC_VOLUME - Math.pow( Map.SIDE - 1, 3 );

  Map.prototype.init = function ( callback ) {
    this.initializePlayersCallback = callback;
    this.sphereImage.addEventListener( 'load', this.onLoadSphereImage.bind(this), false );
    this.rewardImage.addEventListener( 'load', this.onLoadRewardImage.bind(this), false );
    this.rewardImage.src = 'images/diamond.png';
    this.makeScoreKeeper();
    this.scene.add( this.group );
  };

  Map.prototype.makeScoreKeeper = function () {
    var canvas1 = document.createElement('canvas');
    canvas1.width = 1000;
    canvas1.height = 1000;
    var context1 = canvas1.getContext('2d');
    context1.font = "Bold 20px Helvetica";
    context1.fillStyle = "rgba(0,0,0,0.95)";
    context1.fillText('Text bit', 500, 500);

    // canvas contents will be used for a texture
    var texture1 = new THREE.Texture(canvas1)
    texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial({
        map: texture1,
        side: THREE.DoubleSide
    });
    material1.transparent = true;

    var mesh1 = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2000, 2000),
        material1
    );
    mesh1.position.set(-150, 150, 151);
    this.group.add(mesh1);
  };

  Map.prototype.onLoadSphereImage = function (e) {
    // MAKE CUBE OF SPHERICAL SPRITES
    var offset = ( ( Map.SIDE - 1 ) * Map.SEPARATION ) / 2;
    for ( var i = 0; i < Map.CUBIC_VOLUME; i++ ) {
      var xi = ( i % Map.SIDE );
      var yi = Math.floor( ( i / Map.SIDE ) % Map.SIDE );
      var zi = Math.floor( i / ( Map.SIDE * Map.SIDE ) );

      if (
        xi === Map.SIDE - 1 || xi === 0 ||
        yi === Map.SIDE - 1 || yi === 0 ||
        zi === Map.SIDE - 1 || zi === 0
      ) {

        var sphere = new THREE.CSS3DSprite( this.sphereImage.cloneNode() );
        sphere.position.x = xi * Map.SEPARATION - offset;
        sphere.position.y = yi * Map.SEPARATION - offset;
        sphere.position.z = zi * Map.SEPARATION - offset;
        sphere.element.style.opacity = "0.1";
        $(sphere.element).css( "border-radius", "100px" );
        sphere.locId = i;
        this.group.add( sphere );
        this.locIds.push( i );

        // if ( sphere.position.x === 0 &&
        //      sphere.position.y === 0 &&
        //      sphere.position.z > 0 ) {
        //   selectedIndex = i;
        //   selected = sphere;
        //   selectedSpheres[ sphere.spotId ] = true;
        //   selectedSide = 'z';
        //   startCamPos = endCamPos = getEndCameraPosition( selected );
        //   camera.position.copy( startCamPos );
        // }

      } else {
        sphere = null;
      }

      this.locations[i] = sphere;
    }

    this.initializePlayersCallback();
    this.placeReward();
  };

  Map.prototype.placeReward = function () {
    if (this.rewardLocId ) {
      this.locations[ this.rewardLocId ].element.style.display = "block";
    }

    var idx;
    do {
      idx = Math.floor( Math.random() * this.locIds.length );
      this.rewardLocId = this.locIds[idx];
    } while ( this.locations[ this.rewardLocId ].isOccupied );
    this.reward.position.copy( this.locations[ this.rewardLocId ].position );
    this.locations[ this.rewardLocId ].element.style.display = "none";

  };

  Map.prototype.onLoadRewardImage = function (e) {
    this.reward = new THREE.CSS3DSprite( this.rewardImage.cloneNode() );
    this.group.add( this.reward );
    this.sphereImage.src = 'images/sprite.png';
  };

  Map.prototype.makeLocationOccupied = function ( locId, color ) {
    this.locations[ locId ].element.style.opacity = "0.8";
    this.locations[ locId ].isOccupied = true;
    $(this.locations[ locId ].element).css( 'background', color );
  };

  Map.prototype.makeLocationVacant = function ( locId ) {
    this.locations[ locId ].element.style.opacity = "0.1";
    this.locations[ locId ].isOccupied = false;
    $(this.locations[ locId ].element).css( 'background', 'transparent' );
  };

  Map.prototype.makeLocationBricked = function ( locId, id ) {
    if ( CUBOA.Game.POOP ) {
      if ( id ) {
        this.locations[ locId ].poop = id.toString();
      }
      this.locations[ locId ].isOccupied = true;

    }
    $(this.locations[ locId ].element).css( 'webkitFilter', 'brightness(0.5) contrast(1.5)' )
                                      .css( 'filter', 'brightness(0.5) contrast(1.5)' );

  };

  Map.prototype.createWireframe = function () {
    // wireframe grid
    var side = ( Map.SIDE - 1 ) * Map.SEPARATION;

    var cubeGeometry = new THREE.BoxGeometry( side, side, side, sideLength, sideLength, sideLength );
    var cubeMesh = new THREE.Mesh( cubeGeometry, new THREE.MeshBasicMaterial({
      color: 0xf0f0f0,
      opacity: 0.5
    }) );
    var helper = new THREE.EdgesHelper( cubeMesh, 0xc3c3c3 );
    helper.material.linewidth = 2
    this.scene2.add( cubeMesh );
    this.scene2.add( helper );
  }

})();
