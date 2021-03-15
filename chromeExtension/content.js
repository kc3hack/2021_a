class MascotManager{
  constructor(chrome) { //init
    this.chrome=chrome;
  }
  addMascot(){
    this.setImage();
  }
  setImage(){
    debugger;
    var topBody=document.getElementsByTagName("body");
    var img_area=document.createElement("div");
    var imgsrc=this.chrome.extension.getURL('image/asi-removebg-preview.png');
    var img_element = img_area.appendChild(document.createElement("img"));
    img_element.src=imgsrc;
    img_element.alt = "mascot";
    img_element.width = 500;
    img_element.setAttribute("style", "position:absolute; left:0px; top:0px;");
    topBody[0].appendChild(img_area);
  }
}
var mascotManager=new MascotManager(chrome);
var manager = null;
function main(chrome) {
  chrome.runtime.onMessage.addListener(function (message) {
    switch (message) {
      case "add":
        if (manager == null) {
          manager=mascotManager;
          //manager.start();
          manager.addMascot();
        }
        
        break;
      case "remove":
        if (manager != null)
          //manager.removeKitty();
        break;
      case "clear":
        if (manager != null)
          //manager.clearKitties();
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
