document.addEventListener('DOMContentLoaded', function() {
  
  document.getElementById("update-button").addEventListener("click", updateSetting);

  restoreSetting();

});

function updateSetting() {
  var textSize = document.getElementById("text-size-select").value;
  var textColor = document.getElementById("text-color-select").value;
  var language = document.getElementById("language-select").value;
  var timeOffset = document.getElementById("offset-input").value;
  var disable = document.getElementById("disable-checkbox").checked;

  var netflixSubtitlesSetting = {
    language: language,
    textSize: textSize,
    textColor: textColor,
    timeOffset: timeOffset,
    disable: disable
  };

  chrome.storage.local.set({ netflixSubtitlesSetting: netflixSubtitlesSetting }, function(){});

  updatePlayer(netflixSubtitlesSetting, function() {
    window.close();
  });
}

function updatePlayer(netflixSubtitlesSetting, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
     chrome.tabs.sendMessage(tabs[0].id, netflixSubtitlesSetting, function() {
        if (callback) callback();
     });
  });
}

function restoreSetting() {
  chrome.storage.local.get("netflixSubtitlesSetting", function(items) {    
    if (items.netflixSubtitlesSetting) {
      netflixSubtitlesSetting = items.netflixSubtitlesSetting;
      document.getElementById("text-size-select").value = netflixSubtitlesSetting.textSize;
      document.getElementById("text-color-select").value = netflixSubtitlesSetting.textColor;
      document.getElementById("language-select").value = netflixSubtitlesSetting.language;
      document.getElementById("offset-input").value = netflixSubtitlesSetting.timeOffset;
      document.getElementById("disable-checkbox").checked = netflixSubtitlesSetting.disable;
      updatePlayer(netflixSubtitlesSetting);
    }
  });
}