const toMoney = (n) => (n / 100).toFixed(2);

function hideAllScreens() {
  TweenLite.set(document.getElementById('studies'), {
    display: "none",
  })
  TweenLite.set(document.getElementById('error'), {
    display: "none",
  })
  TweenLite.set(document.getElementById('waiting'), {
    display: "none",
  })
}

function displayCorrectScreen() {
  hideAllScreens();
  chrome.storage.local.get('error', function(result) {
    if (result.error == undefined || result.error == true) {
      TweenLite.set(document.getElementById('error'), {
        display: "inherit"
      });
    }
    else {
      TweenLite.set(document.getElementById('waiting'), {
        display: "inherit"
      });
    }

    chrome.storage.local.get('studies', function(result) {
      if (result.studies != undefined && result.studies.length > 0) {
        hideAllScreens();
        TweenLite.set(document.getElementById('studies'), {
          display: "visible",
        })
      }
    });
  });

}

function displayChecked() { 
  chrome.storage.local.get(null, function(result) {
    let lastDate = new Date(result.checked);
    let lastTime = lastDate.getTime() / 1000;
    let now = (new Date()).getTime() / 1000;
    let secSince = Math.round(now-lastTime);

    let finalString = "less than a minute ago"
    if (secSince > 60) {
      if (secSince/60 > 1) {
        finalString = `${secSince/60} minutes ago`;
      } else {
        finalString = `${secSince/60} minute ago`;
      }
    }

  document.getElementById('checked').textContent = `Last checked ${finalString}`;
  });
}

function displayOptions(options) {
  document.getElementById('alert').value = options.alert;
  document.getElementById('interval').value = options.interval;
}

function studyHTML(study) {
  return `<div class="card mt-2">
    <div class="card-header p-0" style="line-height: 1;">
      <b><a href="https://app.prolific.co/studies" target="_blank">${
        study.name
      }</a></b>
    </div>
    <div class="card-block" style="line-height: 1.25;">
      <table class="w-100 small">
        <tr>
          <td class="w-50">
            <b>Hosted By:</b> <span>${study.researcher.institution.name ||
              study.researcher.name}</span>
          </td>
          <td class="w-50">
            <b>Available Places:</b> <span>${study.total_available_places -
              study.places_taken}</span>
          </td>
        </tr>
        <tr>
          <td class="w-50">
            <b>Reward:</b> <span>${toMoney(study.reward)}</span>
          </td>
          <td class="w-50">
            <b>Reward /hr:</b> <span>${toMoney(
              study.average_reward_per_hour,
            )}</span>
          </td>
        </tr>
        <tr>
          <td class="w-50">
            <b>Completion Time:</b> <span>${
              study.estimated_completion_time
            } minutes</span>
          </td>
        </tr>
      </table>
    </div>
  </div>`;
}

function displayStudies(studies) {
  if (studies.length) {
    studies.forEach((o) => {
      document
        .getElementById('studies')
        .insertAdjacentHTML('beforeend', DOMPurify.sanitize(studyHTML(o)));
    });
  } else {
    document
      .getElementById('studies')
      .insertAdjacentHTML(
        'beforeend',
        '<a href="https://app.prolific.co/studies" target="_blank">No Studies</a>',
      );
  }
}

chrome.storage.local.get(null, (items) => {
  const { checked, options, studies } = items;

  // displayBalance();
  displayOptions(options);
  displayStudies(studies);
});

document.addEventListener('change', (event) => {
  const interval = document.getElementById('interval').value;
  const alert = document.getElementById('alert').value;

  chrome.storage.local.set({ options: { alert, interval } });
  chrome.runtime.sendMessage({ prolific: true });

  if (event.target.id === 'alert') {
    switch (event.target.value) {
      case 'none':
        // no sound for you
        break;
      case 'sweet-alert-1':
      case 'sweet-alert-2':
      case 'sweet-alert-3':
      case 'sweet-alert-4':
      case 'sweet-alert-5':
        const audio = new Audio(`/audio/${event.target.value}.wav`);
        audio.play();
        break;
      case 'voice':
        var synth = window.speechSynthesis;
        var voices = synth.getVoices();
        var utterThis = new SpeechSynthesisUtterance('New studies available on Prolific.');
        utterThis.voice = voices[0];
        synth.speak(utterThis);
        break;
    }
  }
});

window.onload = function(){
  displayChecked();
  displayCorrectScreen();
  chrome.storage.onChanged.addListener(function() {
    displayCorrectScreen();
    displayChecked();
  });

  var tween = TweenLite.to(document.getElementById('settings-page'), 0.6, {
    ease: Power2.easeInOut,
    right: "0%",
    paused: true,
    reversed: true,
  })
  document.getElementById('settingsbutton').onclick = function() {
    tween.paused(false);
    tween.reversed(!tween.reversed());
  }
  document.getElementById('checkbutton').onclick = function() {
    chrome.runtime.sendMessage({ prolific: true });
  }

  setInterval(function() {
    displayChecked();
  }, 10000);
}