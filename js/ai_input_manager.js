var
  leftMap        = new Array(65536),
  rightMap       = new Array(65536),
  mirrorMap      = new Array(65536),
  SmirrorMap     = new Array(65536),
  moveLeftScore  = new Array(65536),
  moveRightScore = new Array(65536);

function pushLeft(n) {
  if ((n&0xf0)==0)
    n = (n&0xff00) | ((n&0xf)<<4);
  if ((n&0xf00)==0)
    n = (n&0xf000) | ((n&0xff)<<4);
  if ((n&0xf000)==0)
    n <<= 4;
  return n;
}

function genMap() {
  for(var i=0; i<65536; ++i)
    mirrorMap[i] = ((i&0xf)<<12) | ((i&0xf0)<<4) | ((i&0xf00)>>4) | (i>>12);
  for(var i=0; i<65536; ++i)
    SmirrorMap[i] = ((i&0xf)<<4) | ((i&0xf0)>>4) | ((i&0xf00)<<4) | ((i&0xf000)>>4);
  for(var i=65535, i2; i>=0; --i) {
    var scoreSum=0;
    i2 = pushLeft(i);
    if ( (i2&0xf000) && ((i2^(i2<<4))&0xf000) == 0) {
      scoreSum += (2<<((i2&0xf000)>>12));
      i2 = (i2&0xf0ff) + 0x1000;
    }
    if ( (i2& 0xf00) && ((i2^(i2<<4))& 0xf00) == 0) {
      scoreSum += (2<<((i2&0xf00)>>8));
      i2 = (i2&0xff0f) + 0x100;
    }
    if ( (i2&  0xf0) && ((i2^(i2<<4))&  0xf0) == 0) {
      scoreSum += (2<<((i2&0xf0)>>4));
      i2 = (i2&0xfff0) + 0x10;
    }
    i2 = pushLeft(i2);
    moveLeftScore[i] = scoreSum;
    leftMap[i] = i2;
  }
  for(var i=65535; i>=0; --i){
    moveRightScore[mirrorMap[i]] = moveLeftScore[i];
    rightMap[mirrorMap[i]] = mirrorMap[leftMap[i]];
  }
}

genMap();

function _MyBoard(grid) {
  var self = this;
  self.row = [0, 0, 0, 0];
  
  grid.cells.forEach(function (column, j) {
    column.forEach(function (cell, i) {
      if (cell) {
        self.setCell(i, j, cell.value);
      }
    });
  });
}

_MyBoard.prototype.move = function(direction) {
  var ret = 0;
  var change = false;

  switch (direction) {
    case 3: // left
      for(var i=0; i<4; ++i) {
        if (this.row[i] != leftMap[this.row[i]])
          change = true;
        ret += moveLeftScore[this.row[i]];
        this.row[i] = leftMap[this.row[i]];
      }
      break;
    case 1: // right
      for(var i=0; i<4; ++i) {
        if (this.row[i] != rightMap[this.row[i]])
          change = true;
        //console.log(this.row[i] + " " + moveRightScore[this.row[i]]);
        ret += moveRightScore[this.row[i]];
        this.row[i] = rightMap[this.row[i]];
      }
      break;
    case 0: // up
      this.trans();
      ret = this.move(3);
      change = true;
      this.trans();
      break;
    case 2: // left
      this.trans();
      ret = this.move(1);
      change = true;
      this.trans();
      break;
  }
  if(!change)
    return -1;
  else
    return ret;
}

_MyBoard.prototype.getCell = function(x, y) {
  return (this.row[x]>>((3-y)<<2)) & 0xf;
}

_MyBoard.prototype.setCell = function(x, y, val) {
  val = Math.log2(val);
  this.row[x] = (this.row[x] & (0xffff^(0xf<<((3-y)<<2)))) | (val<<((3-y)<<2));
}

_MyBoard.prototype._getScore = function(attrs) {
  var ret=0;
  for(var i in attrs) {
    var id = 0;
    for(var j=0; j<attrs[i].slotNum; j++){
      var pos = (attrs[i].position>>(j<<2))&0xf;
      id |= this.getCell(pos>>2,pos&0x3)<<(j<<2);
    }
    ret += attrs[i].data[id];
  }
  return ret;
}

_MyBoard.prototype.getScore = function(attrs) {
  var ret = 0;
  ret += this._getScore(attrs);
  this.mirrorUD();
  ret += this._getScore(attrs);
  this.mirrorLR();
  ret += this._getScore(attrs);
  this.mirrorUD();
  ret += this._getScore(attrs);
  this.trans();
  ret += this._getScore(attrs);
  this.mirrorUD();
  ret += this._getScore(attrs);
  this.mirrorLR();
  ret += this._getScore(attrs);
  this.mirrorUD();
  ret += this._getScore(attrs);
  return ret;
}

_MyBoard.prototype.swap = function(r1,r2,pos) {
	this.row[r2]^=this.row[r1]&pos;
	this.row[r1]^=this.row[r2]&pos;
	this.row[r2]^=this.row[r1]&pos;
}

_MyBoard.prototype.trans = function() {
  for(var i=2; i<4; i++)
    this.row[i]=mirrorMap[this.row[i]];
  this.swap(0,3,0xff);
  this.swap(1,2,0xff);
  for(var i=2; i<4; i++)
    this.row[i]=mirrorMap[this.row[i]];
  for(var i=1; i<4; i+=2)
    this.row[i]=SmirrorMap[this.row[i]];
  this.swap(0,1,0xff0);
  this.swap(2,3,0xf00f);
  for(var i=1; i<4; i+=2)
    this.row[i]=SmirrorMap[this.row[i]];
}
_MyBoard.prototype.mirrorLR = function() {		//left right mirror
  for(var i=0; i<4; ++i) {
    this.row[i] = mirrorMap[this.row[i]];
  }
}
_MyBoard.prototype.mirrorUD = function() {    //upside down mirror
  var _;
  _ = this.row[0], this.row[0] = this.row[3], this.row[3] = _;
  _ = this.row[1], this.row[1] = this.row[2], this.row[2] = _;
}


function AiInputManager() {
  var AI_DATA_SRC = "data/LR40-3-10-0.005.dat";
  var self = this;
  self.events = {};
  self.listen();

  (function(src) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", src, true);
    xhttp.responseType = "arraybuffer";

    xhttp.onload = function(event) {
      var buffer = xhttp.response;
      if (buffer) {
        var attrN = new Uint32Array(buffer.slice(0, 4))[0];
        self.attrs = []
        var offset = 4;
        for(var i=0; i<attrN; i++) {
          var attr = {}
          attr.slotNum = new Uint32Array(buffer.slice(offset, offset+4))[0];
          offset += 4;
          attr.position = new Uint32Array(buffer.slice(offset, offset+4))[0];
          offset += 4;
          attr.data = new Float32Array(buffer.slice(offset, offset+(1<<(attr.slotNum<<2))<<2))
          offset += (1<<(attr.slotNum<<2))<<2;
          self.attrs.push(attr);
        }
      }
    };
    xhttp.send();

    

  })(AI_DATA_SRC);
}

AiInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

AiInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

AiInputManager.prototype.listen = function () {
  var self = this;

  // Respond to button presses
  self.bindButtonPress(".retry-button", this.restart);
  self.bindButtonPress(".restart-button", this.restart);
  self.bindButtonPress(".keep-playing-button", this.keepPlaying);

  self.on("update", function(data) {
    if (data.setup) {
      self.bindButtonPress(".ai-button", (function() {
        self.aiMove(data);
      }).bind(self));
    }
    else if (!data.metadata.terminated) {
      setTimeout(function() {
        self.aiMove(data)
      }, 100);
    }
  });

};

AiInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

AiInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

AiInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

AiInputManager.prototype.randomMove = function (data) {
  var nextStep = (Math.random()*4)|0;
  this.emit("move", nextStep);
}

AiInputManager.prototype.aiMove = function (data) {
  var nextDir = 0;
  var maxScore = 0;
  for(var direction=0; direction<4; direction++) {
    //console.log("dir:" + direction);
    var board = new _MyBoard(data.grid);
    var score = board.move(direction)
    //console.log("score:" + score);
    if (score>=0) {
      score += board.getScore(this.attrs);
      //console.log("score2:" + score);
      if (score>maxScore) {
        nextDir = direction;
        maxScore = score;
      }
    }
  }
  this.emit("move", nextDir);
}

AiInputManager.prototype._move = function (data, direction) {
}
