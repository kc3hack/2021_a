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
    this.canvas.style.top = "0px";
    this.canvas.style.left = "0px";
    this.canvas.style.zIndex = "2147400000";
    var _this=this;
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
  }
  update(fps) {
    this.animTimer += 10 / fps;
    this.updateState(fps);
    this.move(fps);
    this.checkBounds();
    this.draw();
  }
isBeingGrabbed(){
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
    this.checkAndChageStates(this.randomState());
    this.xVector = this.direction == Direction.Right ? 2 : -2;
  }
  updateStanding() {
    this.checkAndChageStates(this.randomState());
  }
  updateWalking() {
    this.checkAndChageStates(this.randomState());
    this.xVector = this.direction == Direction.Right ? 1 : -1;
  }
  draw() {
    this.canvas.style.top = "" + this.y + "px";
    this.canvas.style.left = "" + this.x + "px";
    var context = this.canvas.getContext("2d");
    if (context === null) {
      throw new ReferenceError("context is null!");
    }
    context.clearRect(0, 0, 32, 32);
    context.drawImage(this.image, 0, 0, this.mascot_width, this.mascot_height, 0, 0, this.mascot_width, this.mascot_height);
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
        var imgsrc = chrome.extension.getURL('image/asi-removebg-preview.png');
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
  // listening(){
  // }
  // reply(){
  // }
  communicate(){
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

    var canvas = document.getElementById("mascotDivElement");

    recognition.onresult = (event) => {
      console.log(event.results[0][0].transcript);
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

        }

        break;
      case "remove":
        if (manager != null)
          manager.removeMascot();
        manager = null;
        break;
      case "clear":
        if (manager != null)
          //manager.clearKitties();
        break;
      case "talk":
        if (manager != null)
          mascotAction.communicate();
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
