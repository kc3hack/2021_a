//import Konva from "./konva.min.js"
class MascotStates {
  constructor() {
    this.Falling = 0;
    this.Grabbed = 1;
    this.Running = 2;
    this.Walking = 3;
    this.Standing = 4;
  }
  getMaxNum() {
    return 4;
  }
}
class DIRECTION {
  constructor() {
    this.Right = 0;
    this.Left = 1;
  }
}
class Animation {
  constructor() {
    this.walk=new Anim("image/walk.gif");
    this.fall=new Anim("image/fall1.gif");
    this.eat=new Anim("image/eat.gif");
    this.land=new Anim("image/fall2.gif");
    this.chat=new Anim("image/chat.gif");
  }
  getAll(){
    return [this.walk,this.fall,this.eat,this.land,this.chat];
  }
  
}
class Anim{
  constructor(src) {
    this.src=src;
    this.frames=[];
}
  }
var animation=new Animation();
var Direction = new DIRECTION();
var MASCOT_STATES = new MascotStates();
class Mascot {
  constructor(mascotImg, mascotDiv, img_width, img_height, imgsrc) {
    this.mascot_img = mascotImg;
    this.mascot_div = mascotDiv;
    this.mascot_div.removeChild(this.mascot_img);
    this.mascot_height = img_height;
    this.mascot_width = img_width;
    this.direction = Direction.Right;
    this.y = 0;
    this.xVector = 0;
    this.yVector = 0;
    this.animMax = 0;
    this.animTimer = 0;
    this.canvas = document.createElement("canvas");
    this.canvas.id = 'mascotCanvas';
    this.canvas.style.position = "fixed";
    this.canvas.width = 700;
    this.canvas.height = 500;
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
    this.canvas.style.zIndex = "2147400000";
    var _this = this;
    this.canvas.addEventListener("mousedown", function (event) {
      _this.mouseXOffset = _this.x - event.clientX;
      _this.mouseYOffset = _this.y - event.clientY;
      _this.state = MASCOT_STATES.Grabbed;
    });
    this.mascot_div.appendChild(this.canvas);
    this.direction = this.randomDir();
    this.x = Math.floor(Math.random() * window.innerWidth - this.mascot_width);
    this.state = MASCOT_STATES.Standing;
    this.canvas = document.getElementById("mascotCanvas");
    this.image = new Image();
    this.image.src = imgsrc;
    this.gif = new Gif();
    var gif = this.gif;

    this.frames = animation.fall.frames;
    
    this.idx = 0;

    //var initGif=this.initGif;
    return new Promise(function (resolve, reject) {
      try {
        
          _this.createGifFrames(_this,gif,animation.walk.frames,animation.walk.src)
          .then(msct=>_this.createGifFrames(_this,gif,animation.land.frames,animation.land.src))
          .then(msct=>_this.createGifFrames(_this,gif,animation.eat.frames,animation.eat.src))
          .then(msct=>_this.createGifFrames(_this,gif,animation.chat.frames,animation.chat.src))
          .then(msct=>{
            _this.createGifFrames(_this,gif,animation.fall.frames,animation.fall.src);
            resolve(msct);})
            
      } catch (error) {
        reject(error);
      }
    });
    
      
    
  }
  createGifFrames(__this,_gif,_frames,imgsrc){
    var _this=__this;
    var gif=_gif;
    var frames=_frames;
    return new Promise(function (resolve, reject) {
      try {
        var img=new Image();
        img.src=chrome.extension.getURL(imgsrc);
        fetch(chrome.extension.getURL(imgsrc)).then(res => res.blob()).then(blob => blob.arrayBuffer()).then(buffer => {
      
          gif.parse(buffer,
            function () { // on parse
              _this.initGif(_this.canvas,gif,frames);
              
              resolve(_this);
            },
            function (e) { // on error
              alert(e);
            },
            function (e) { // on progress
              console.log('Parsing...' + ((100 * e.loaded / e.total) | 0) + '%');
            });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  initGif(_canvas,_gif,_frames){
    var canvas = _canvas;
    var gif=_gif;
    var frames=_frames;
    return new Promise(function (resolve, reject) {
      try {
        var context = canvas.getContext('2d');
        var frames2 = gif.createFrameImages(context, true,true);
        for (var i = 0; i < frames2.length; i++) {
          frames.push(frames2[i]);
        }
        console.log("num frames:"+frames.length);
        // pre-rendering
        resolve(frames);
      } catch (error) {
        reject(error);
      }
    });
  }

  update(fps) {
    this.animTimer += 10 / fps;
    this.updateState(fps);
    this.move(fps);
    this.checkBounds();
    this.draw();
  }
  isBeingGrabbed() {
    this.frames=animation.fall.frames;
    return this.state === MASCOT_STATES.Grabbed;
  }
  updateState(fps) {
    if (!this.isBeingGrabbed() &&
      this.y < window.innerHeight - this.mascot_height) {
      this.state = MASCOT_STATES.Falling;
    }
    switch (this.state) {
      case MASCOT_STATES.Falling:
        this.updateFalling(fps);
        break;
      case MASCOT_STATES.Running:
        this.updateRunning();
        break;
      case MASCOT_STATES.Standing:
        this.updateStanding();
        break;
      case MASCOT_STATES.Walking:
        this.updateWalking();
        break;
    }
  }
  randomDir() {
    return Math.random() > 0.5 ? Direction.Left : Direction.Right;
  }
  checkAndChageStates(newState) {
    if (this.animTimerOverdue()) {
      this.animMax = Math.floor(Math.random() * 30) + 10;
      this.animTimer = 0;
      this.state = newState;
      this.direction = this.randomDir();
    }
  }
  animTimerOverdue() {
    return this.animTimer > this.animMax;
  }
  updateFalling(fps) {
    this.frames=animation.fall.frames;
    if (this.y < window.innerHeight - this.mascot_height) {
      this.yVector = this.yVector + 2 * (1 / fps);
    }
    else {
      if (Math.abs(this.yVector) < 0.1) {
        this.y = window.innerHeight - this.mascot_height;
        this.state = MASCOT_STATES.Standing;
      }
      this.yVector *= -0.5;
    }
  }
  updateRunning() {
    this.frames=animation.walk.frames;
    this.checkAndChageStates(this.randomState());
    this.xVector = this.direction == Direction.Right ? 2 : -2;
  }
  updateStanding() {
    this.frames=animation.eat.frames;
    this.checkAndChageStates(this.randomState());
  }
  updateWalking() {
    this.frames=animation.walk.frames;
    this.checkAndChageStates(this.randomState());
    this.xVector = this.direction == Direction.Right ? 1 : -1;
  }
  onDrawFrame(ctx, frame) {
    this.canvas.style.top = "" + this.y + "px";
    this.canvas.style.left = "" + this.x + "px";
    // update canvas size
    //canvas.width = frame.width;
    //canvas.height = frame.height;
    // update canvas that we are using for Konva.Image
    ctx.drawImage(frame.buffer, 0, 0, this.mascot_width, this.mascot_height, 0, 0, this.mascot_width, this.mascot_height);
    // redraw the layer
    this.layer.draw();
  }
  draw() {
    //debugger;
    var adjustSpeed=6;
    this.canvas.style.top = "" + this.y + "px";
    this.canvas.style.left = "" + this.x + "px";
    var context = this.canvas.getContext("2d");
    if (context === null) {
      throw new ReferenceError("context is null!");
    }
    if(isNaN(this.idx)){
      this.idx = 0;
    }if(typeof this.frames[Math.floor(this.idx/adjustSpeed)]==="undefined"){
      this.idx=0;
      return;
    }
    
    context.clearRect(0,0,this.mascot_width,this.mascot_height);
    context.drawImage(this.frames[Math.floor(this.idx/adjustSpeed) ].image, 0, 0, this.mascot_width, this.mascot_height, 0, 0, this.mascot_width, this.mascot_height);
    this.idx = (this.idx ) % (this.frames.length*adjustSpeed)+ 1;
    if(this.idx==this.frames.length*adjustSpeed){
      this.idx = 0;
    }
    //this.mascot_img.setAttribute("style", "position:absolute; left:" + this.x + "px; top:" + this.y + "px;");
  }
  randomState() {
    return Math.floor(Math.random() * MASCOT_STATES.getMaxNum());
  }
  move(fps) {
    if (this.state == MASCOT_STATES.Grabbed ||
      this.state == MASCOT_STATES.Standing) {
      this.xVector = 0;
      this.yVector = 0;
    }
    this.x += this.xVector * (100 / fps);
    this.y += this.yVector * (100 / fps);
  }
  checkBounds() {//ページ端にいる場合の処理
    if (this.x < 0) {
      this.x = 0;
      if (!this.isBeingGrabbed()) {
        this.flip();
      }
      this.xVector = -this.xVector;
    }
    else if (this.x > window.innerWidth - this.mascot_width) {
      this.x = window.innerWidth - this.mascot_width;
      if (!this.isBeingGrabbed()) {
        this.flip();
      }
      this.xVector = -this.xVector;
    }
    if (this.y < 0) {
      this.y = 0;
    }
    else if (this.y > window.innerHeight - this.mascot_height) {
      this.y = window.innerHeight - this.mascot_height;
    }
  }
  flip() {//反転
    if (this.direction === Direction.Left) {
      this.direction = Direction.Right;
    }
    else {
      this.direction = Direction.Left;
    }
  }
  updateGrabbed(e) {
    this.x = e.clientX + this.mouseXOffset;
    this.y = e.clientY + this.mouseYOffset;
  }
  release() {
    this.state = MASCOT_STATES.Falling;
  }
  dispose() {
    var childDiv = document.getElementById("mascotDivElement");
    document.body.removeChild(childDiv);
  }
}


class MascotManager {
  constructor(chrome, width, fps) { //init
    this.chrome = chrome;
    this.img_width = width;
    this.fps = fps;
    this.mascot = null;
    document.addEventListener("mousemove", this.updateGrabbedMascot.bind(this));
    document.addEventListener("blur", this.releaseGrabbedMascot.bind(this));
    document.addEventListener("mouseup", this.releaseGrabbedMascot.bind(this));
    window.addEventListener('blur', this.releaseGrabbedMascot.bind(this));
  }
  addMascot() {
    var func1 = this.setImage;
    var func2 = this.setMascot;
    var chrome = this.chrome;
    var width = this.img_width;
    return new Promise(function (resolve, reject) {
      try {
        func1(chrome, width).then(arr => {
          resolve(new Mascot(arr[1], arr[0], arr[1].naturalWidth, arr[1].naturalHeight, arr[1].src));
        })
      } catch (e) {
        reject(e);
      };
    })
  }
  setMascot(mascot) {
    this.mascot = mascot;
  }
  setImage(chrome, width) {
    return new Promise(function (resolve, reject) {
      try {
        var topBody = document.body;
        var img_area = document.createElement("div");
        img_area.id = "mascotDivElement";
        var imgsrc = chrome.extension.getURL('image/walk.gif');
        var img_element = img_area.appendChild(document.createElement("img"));
        img_element.src = imgsrc;
        img_element.alt = "mascot";
        img_element.width = width;

        img_element.setAttribute("style", "position:absolute; left:0px; top:0px;");
        topBody.appendChild(img_area);
        img_element.addEventListener("load", function () {
          resolve([img_area, img_element]);
        });

      } catch (e) {
        reject(e);
      };
    }
    )

  }
  start() {
    if (this.intervalId === undefined) {
      this.intervalId = window.setInterval(this.update.bind(this), 1000 / this.fps);
    }
  }
  pause() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
  update() {
    if (this.mascot == null) {
      return;
    }

    this.mascot.update(this.fps);
    if (this.mascot.isBeingGrabbed()) {
      if (this.grabbedMascot !== undefined &&
        this.grabbedMascot !== this.mascot) {
        this.releaseGrabbedMascot();
      }
      this.grabbedMascot = this.mascot;
    }
  }
  releaseGrabbedMascot() {
    if (this.grabbedMascot !== undefined) {
      this.grabbedMascot.release();
      this.grabbedMascot = undefined;
    }
  }
  updateGrabbedMascot(event) {
    if (this.grabbedMascot !== undefined) {
      this.grabbedMascot.updateGrabbed(event);
    }
  }
  removeMascot() {
    if (this.mascot != null) {
      this.mascot.dispose();
      this.mascot = null;
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

class MascotAction {
  constructor() {
    this.mascot = null;
    this.fontsize = 18;
  }

  copyMascot(mascot) {
    this.mascot = mascot;
  }

  //吹き出しと文章描画
  drawMessage(lineText) {
    this.canvas = document.getElementById("mascotCanvas");
    var context = this.canvas.getContext("2d");
    if (context === null) {
      throw new ReferenceError("context is null!");
    }

    var border = 1;
    var padding = 5;
    var limitedWidth = this.canvas.width - this.mascot.mascot_width - ((border + padding) * 2);

    var newLineTextList = [];

    //文章を改行したものに変換
    if (context.measureText(lineText).width > limitedWidth) {
      var charList = lineText.split("");
      var preLineText = "";
      var lineText = "";
      charList.forEach((char) => {
        lineText += char;
        if (context.measureText(lineText).width > limitedWidth) {
          newLineTextList.push(preLineText);
          lineText = char;
        }
        preLineText = lineText;
      });
    }
    newLineTextList.push(lineText);

    //キャンバスをクリア
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var boxWidth = border * 2 + padding * 2 + this.fontsize * newLineTextList[0].length;
    var boxHeight = border * 2 + padding * 2 + this.fontsize * newLineTextList.length;

    //テキストボックス描画部分
    context.fillStyle = "black";
    context.fillRect(this.mascot.mascot_width, 0, boxWidth, boxHeight);
    context.fillStyle = "white";
    context.fillRect(this.mascot.mascot_width + border, border, boxWidth - border * 2, boxHeight - border * 2);

    //テキスト出力
    context.font = this.fontsize + "px serif";
    context.fillStyle = "black";
    newLineTextList.forEach((lineText, index) => {
      context.fillText(lineText, this.mascot.mascot_width + border + padding, border + (this.fontsize * (index + 1)));
    });
    console.log(this.canvas.width);
    console.log(this.mascot.mascot_width);
  }

  clearText() {
    this.canvas = document.getElementById("mascotCanvas");
    var context = this.canvas.getContext("2d");
    if (context === null) {
      throw new ReferenceError("context is null!");
    }
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  listening() {
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
    var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
    var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

    var recognition = new SpeechRecognition();
    var speechRecognitionList = new SpeechGrammarList();

    recognition.grammars = speechRecognitionList;
    recognition.continuous = false;
    recognition.lang = 'ja-JP'
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    this.drawMessage("どうしたの？");

    recognition.onresult = (event) => {
      //event.results[0][0].transcript：音声入力された文章
      //出力したい文章を引数に入れてください
      this.drawMessage(event.results[0][0].transcript);
    }
  }
}

var mascotManager = new MascotManager(chrome, 500, 30);
var mascotAction = new MascotAction();
var manager = null;
function main(chrome) {
  chrome.runtime.onMessage.addListener(function (message) {
    switch (message) {
      case "add":
        if (manager == null) {
          manager = mascotManager;

          manager.addMascot().then(mascot => {
            manager.setMascot(mascot);
            manager.start();
          })

          mascotAction.copyMascot(manager.mascot);
        }

        break;
      case "remove":
        if (manager != null)
          manager.removeMascot();
        manager = null;
        break;
      case "clear":
        if (manager != null)
          mascotAction.clearText();
        break;
      case "talk":
        if (manager != null) {
          mascotAction.copyMascot(manager.mascot);
          mascotAction.listening();
        }
        break;
    }
    return false;
  });
}

console.log("content.js global");
$(document).ready(function () {
  //debugger;
  console.log("content.js ready");
  main(chrome);
});
