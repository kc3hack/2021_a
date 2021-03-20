((browser) => {
  function showErrorPage() {
      document.getElementById("errorPage").style.display = "block";
      document.getElementById("successPage").style.display = "none";
  }
  function sendMessage(message, retries){
      if(typeof retries !== "number") retries = 0;
      if(retries >= 5) showErrorPage();
      window.browser.tabs.query({
          active: true, currentWindow: true
      }).then((tabs) => {
          for(let tab of tabs) {
              if(tab.status === "loading") {
                  window.setTimeout(() => {
                      sendMessage(message, retries+1);
                  }, 400);
              } else {
                  window.browser.tabs.sendMessage(///*送信先のタブid*/, /*送るモノ*/, function(/*レスポンス*/)
                      tab.id, message).catch((e) => { showErrorPage(); });
              }
          }
      });
  }
  function checkTab(tabs) {
    for (let tab of tabs) {
      if (tab.url.indexOf("chrome:") == 0 ||
        tab.url.indexOf("about:") == 0) {
        return false;
      }
    }
    return true;
  }
  function testPage() {
    return new Promise(function (resolve, reject) {
      try {
        var b = false;
        chrome.tabs.query({
          active: true, currentWindow: true
        }, function (tabs) {
          b = checkTab(tabs);
          console.log(b);
          resolve(b);
        });
      } catch (e) {
        reject(e);
      };
    })
  }
  function initPopup() {
    document.getElementById("errorPage").style.display = "none";
    document.getElementById("successPage").style.display = "block";
    document.getElementById("add").addEventListener(
      "click", () => sendMessage("add", 0));
    document.getElementById("remove").addEventListener(
      "click", () => sendMessage("remove", 0));
    document.getElementById("clear").addEventListener(
      "click", () => sendMessage("clear", 0));
  }
  //ここから実行される
  
  testPage().then(pageWorks => {
    if (pageWorks) {
      
      if (document.readyState === "complete") {
        initPopup();
        }else  {
          window.onload=initPopup;

        
      } 
    }else{
      // document.getElementById("errorPage").style.display = "block";
      // document.getElementById("successPage").style.display = "none";
    }
  });
  
  
  
  
  
  
  
})(window.browser);
