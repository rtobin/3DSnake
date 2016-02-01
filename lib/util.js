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

  // Util.getUnitVecFromObject = function ( object ) {
  //   var vec = new THREE.Vector3();
  //   vec.copy( object.position );
  //   vec.normalize();
  //   return vec;
  // };
  ///////////////////////////////
  function manhattanDistanceBetweenIdsOnCube( startId, endId, sideLength ) {
    var sideLengthsq = Math.pow( sideLength, 2);

    var xiStart = ( startId % sideLength );
    var yiStart = Math.floor( ( startId / sideLength ) % sideLength );
    var ziStart = Math.floor( startId / sideLengthsq );

    var xiEnd = ( endId % sideLength );
    var yiEnd = Math.floor( ( endId / sideLength ) % sideLength );
    var ziEnd = Math.floor( endId / sideLengthsq );

    var xDiff = Math.abs( xiStart - xiEnd );
    var yDiff = Math.abs( yiStart - yiEnd );
    var zDiff = Math.abs( ziStart - ziEnd );

    var xAdd = xiStart + xiEnd;
    var yAdd = yiStart + yiEnd;
    var zAdd = ziStart + ziEnd;

    var additional = sideLength; // won't be this high
    var tmp;

    // on opposite x faces
    if ( xDiff === sideLength - 1 ) {

      // closer to -y face than +y face
      if ( yAdd < sideLength ) {
        tmp = yAdd - 2;
        additional = tmp < additional ? tmp : additional;

      // closer to +y face than -y face
      } else {
        tmp = 2 * sideLength - yAdd - 2;
        additional = tmp < additional ? tmp : additional;
      }

      // closer to -z face than +z face
      if ( zAdd < sideLength ) {
        tmp = zAdd - 2;
        additional = tmp < additional ? tmp : additional;

      // closer to +z face than -z face
      } else {
        tmp = 2 * sideLength - zAdd - 2;
        additional = tmp < additional ? tmp : additional;
      }
    }

    // on opposite y faces
    if ( yDiff === sideLength - 1 ) {

      // closer to -x face than +x face
      if ( xAdd < sideLength ) {
        tmp = xAdd - 2;
        additional = tmp < additional ? tmp : additional;

      // closer to +x face than -x face
      } else {
        tmp = 2 * sideLength - xAdd - 2;
        additional = tmp < additional ? tmp : additional;
      }

      // closer to -z face than +z face
      if ( zAdd < sideLength ) {
        tmp = zAdd - 2;
        additional = tmp < additional ? tmp : additional;

      // closer to +z face than -z face
      } else {
        tmp = 2 * sideLength - zAdd - 2;
        additional = tmp < additional ? tmp : additional;
      }
    }

    // on opposite z faces
    if ( zDiff === sideLength - 1 ) {

      // closer to -x face than +x face
      if ( xAdd < sideLength ) {
        tmp = xAdd - 2;
        additional = tmp < additional ? tmp : additional;

      // closer to +x face than -x face
      } else {
        tmp = 2 * sideLength - xAdd - 2;
        additional = tmp < additional ? tmp : additional;
      }

      // closer to -y face than +y face
      if ( yAdd < sideLength ) {
        tmp = yAdd - 2;
        additional = tmp < additional ? tmp : additional;

      // closer to +y face than -y face
      } else {
        tmp = 2 * sideLength - yAdd - 2;
        additional = tmp < additional ? tmp : additional;
      }
    }

    // if not on opposite faces, just get normal manhattan distance
    additional = additional === sideLength ? 0 : additional;
    return xDiff + yDiff + zDiff + additional;
  }

  function getNearestNeighborIdsOnCube( locId, sideLength ) {
    var neighbors = [];
    var sideLengthsq = Math.pow( sideLength, 2);

    var xi = ( locId % sideLength );
    var yi = Math.floor( ( locId / sideLength ) % sideLength );
    var zi = Math.floor( locId / sideLengthsq );

    // not interior of x-face
    if ( yi === 0 || yi === sideLength - 1 || zi === 0 || zi === sideLength - 1 ) {
      // not on +x face
      if ( xi < sideLength - 1 ) {
        neighbors.push( locId + 1 );
      }

      // not on -x face
      if ( xi > 0 ) {
        neighbors.push( locId - 1 );
      }
    }

    // not interior of y-face
    if ( xi === 0 || xi === sideLength - 1 || zi === 0 || zi === sideLength - 1 ) {
      // not on +y face
      if ( yi < sideLength - 1) {
        neighbors.push( locId + sideLength );
      }

      // not on -y face
      if ( yi > 0 ) {
        neighbors.push( locId - sideLength );
      }
    }

    // not interior of z-face
    if ( yi === 0 || yi === sideLength - 1 || xi === 0 || xi === sideLength - 1 ) {
      // not on +z face
      if ( zi < sideLength - 1 ) {
        neighbors.push( locId + sideLengthsq );
      }

      // not on -z face
      if ( zi > 0 ) {
        neighbors.push( locId - sideLengthsq );
      }
    }

    return neighbors;
  };

  ///////////////////////////////
  // For pathfinding algorithm...

  function getPath(node) {
    var curr = node;
    var path = [];
    while (curr.parent) {
      path.push(curr);
      curr = curr.parent;
    }
    return path;
  }

  function getNextNode(endNode) {
    var curr = endNode;
    var result;
    while (curr.parent) {
      result = curr;
      curr = curr.parent;
    }
    return result;
  }

  function scoreFunc(node) {
    return node.f;
  }

  // AStar search
  var AStar = Util.AStar = {
    search: function( graph, start, end, options ) {
      graph.resetNodes();
      options = options || {};
      var heuristic = options.heuristic || AStar.heuristics.manhattan;
      var closest = options.closest || true;
      var isWallFunc = options.isWallFunc || function (el) { return false; };
      var searchSize = options.searchSize || 40;
      var openHeap = new BinaryHeap( scoreFunc );
      var closestNode = start; // set the start node to be the closest if required

      start.h = heuristic( start.id, end.id, CUBOA.Map.SIDE );
      graph.markNode( start );

      openHeap.push(start);

      while ( openHeap.size() > 0 && graph.markedNodes.length < searchSize ) {
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
        var currentNode = openHeap.pop();

        // End case -- result has been found, return the traced path.
        if ( currentNode === end ) {
          return getNextNode( currentNode );
        }

        // Normal case -- move currentNode from open to closed, process each of its neighbors.
        currentNode.closed = true;

        // Find all neighbors for the current node.
        var neighbors = graph.neighbors( currentNode.id );

        for ( var i = 0; i < neighbors.length; ++i ) {
          var neighbor = neighbors[i];

          if ( neighbor.closed || isWallFunc( neighbor.id ) ) {
            // Not a valid node to process, skip to next neighbor.
            continue;
          }

          // The g score is the shortest distance from start to current node.
          // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
          var gScore = currentNode.g;
          var beenVisited = neighbor.visited;

          if ( !beenVisited || gScore < neighbor.g ) {

            // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
            neighbor.visited = true;
            neighbor.parent = currentNode;
            neighbor.h = neighbor.h || heuristic( neighbor.id, end.id, CUBOA.Map.SIDE );
            neighbor.g = gScore;
            neighbor.f = neighbor.g + neighbor.h;
            graph.markNode( neighbor );
            if ( closest ) {
              // If the neighbour is closer than the current closestNode or if it's equally close but has
              // a cheaper path than the current closest node then it becomes the closest node
              if ( neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g )) {
                closestNode = neighbor;
              }
            }

            if ( !beenVisited ) {
              // Pushing to heap will put it in proper place based on the 'f' value.
              openHeap.push( neighbor );
            } else {
              // Already seen the node, but since it has been rescored we need to reorder it in the heap
              openHeap.rescoreElement( neighbor );
            }
          }
        }
      }

      if ( closest ) {
        return getNextNode( closestNode );
      }

      // No result was found - empty array signifies failure to find path.
      return [];

    },

    heuristics: {
      manhattan: manhattanDistanceBetweenIdsOnCube
    },

    resetNode: function( node ) {
      node.f = 0;
      node.g = 0;
      node.h = 0;
      node.visited = false;
      node.closed = false;
      node.parent = null;
    }
  };


  ////////



  var Graph = Util.Graph = function ( resetNodeFunc ) {
    // this.nodes = [];
    this.nodes = {};
    this.resetNodeFunc = resetNodeFunc;
  };

  Graph.prototype.init = function ( keys ) {
    this.markedNodes = [];
    for ( var i = 0; i < keys.length; i++ ) {
      this.nodes[ keys[i] ] = { id: keys[i] };
      if ( this.nodes[ keys[i] ] ) {
        this.resetNodeFunc( this.nodes[ keys[i] ] );
      }
    }
  };

  Graph.prototype.resetNodes = function () {
    for (var i = 0; i < this.markedNodes.length; i++) {
      this.resetNodeFunc( this.markedNodes[ i ] );
    }
    this.markedNodes = [];
  };

  Graph.prototype.markNode = function ( node ) {
    this.markedNodes.push( node );
  };

  Graph.prototype.neighbors = function ( key ) {
    var ids = getNearestNeighborIdsOnCube( key, CUBOA.Map.SIDE );
    var result = [];
    for ( var i = 0; i < ids.length; i++ ) {
      if ( this.nodes[ ids[i] ] ) {
        result.push( this.nodes[ ids[i] ] );
      }
    }

    return result;
  };

  ////////

  var BinaryHeap = Util.BinaryHeap = function ( scoreFunction ) {
    this.content = [];
    this.scoreFunction = scoreFunction;
  };

  BinaryHeap.prototype = {
    push: function(element) {
      // Add the new element to the end of the array.
      this.content.push(element);

      // Allow it to sink down.
      this.sinkDown(this.content.length - 1);
    },
    pop: function() {
      // Store the first element so we can return it later.
      var result = this.content[0];
      // Get the element at the end of the array.
      var end = this.content.pop();

      // If there are any elements left, put the end element at the
      // start, and let it bubble up.
      if (this.content.length > 0) {
        this.content[0] = end;
        this.bubbleUp(0);
      }
      return result;
    },
    remove: function(node) {
      var i = this.content.indexOf(node);

      // When it is found, the process seen in 'pop' is repeated
      // to fill up the hole.
      var end = this.content.pop();

      if (i !== this.content.length - 1) {
        this.content[i] = end;

        if (this.scoreFunction(end) < this.scoreFunction(node)) {
          this.sinkDown(i);
        } else {
          this.bubbleUp(i);
        }
      }
    },
    size: function() {
      return this.content.length;
    },
    rescoreElement: function(node) {
      this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function(n) {
      // Fetch the element that has to be sunk.
      var element = this.content[n];

      // When at 0, an element can not sink any further.
      while (n > 0) {

        // Compute the parent element's index, and fetch it.
        var parentN = ((n + 1) >> 1) - 1;
        var parent = this.content[parentN];
        // Swap the elements if the parent is greater.
        if (this.scoreFunction(element) < this.scoreFunction(parent)) {
          this.content[parentN] = element;
          this.content[n] = parent;
          // Update 'n' to continue at the new position.
          n = parentN;
        }
        // Found a parent that is less, no need to sink any further.
        else {
          break;
        }
      }
    },
    bubbleUp: function(n) {
      // Look up the target element and its score.
      var length = this.content.length;
      var element = this.content[n];
      var elemScore = this.scoreFunction(element);

      while (true) {
        // Compute the indices of the child elements.
        var child2N = (n + 1) << 1;
        var child1N = child2N - 1;
        // This is used to store the new position of the element, if any.
        var swap = null;
        var child1Score;
        // If the first child exists (is inside the array)...
        if (child1N < length) {
          // Look it up and compute its score.
          var child1 = this.content[child1N];

          child1Score = this.scoreFunction(child1);

          // If the score is less than our element's, we need to swap.
          if (child1Score < elemScore) {
            swap = child1N;
          }
        }

        // Do the same checks for the other child.
        if (child2N < length) {
          var child2 = this.content[child2N];
          var child2Score = this.scoreFunction(child2);
          if (child2Score < (swap === null ? elemScore : child1Score)) {
            swap = child2N;
          }
        }

        // If the element needs to be moved, swap it, and continue.
        if (swap !== null) {
          this.content[n] = this.content[swap];
          this.content[swap] = element;
          n = swap;
        }
        // Otherwise, we are done.
        else {
          break;
        }
      }
    }
  };


})();
