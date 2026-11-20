/* FastFixIt Electronics — printable review card */
(function () {
  "use strict";

  var config = window.FFI_CONFIG || {};
  var url = String(config.reviewUrl || "").trim();
  var qrBox = document.getElementById("review-qr");
  var setupNote = document.querySelector("[data-review-setup]");
  var actions = document.querySelector("[data-review-actions]");
  var printButton = document.querySelector("[data-review-print]");
  var openLink = document.querySelector("[data-review-link]");

  function showSetup(message) {
    if (setupNote) {
      if (message) setupNote.textContent = message;
      setupNote.hidden = false;
    }
    if (actions) actions.hidden = true;
    if (qrBox) qrBox.innerHTML = '<span class="review-qr__empty">Review link not set</span>';
  }

  if (!url || url.indexOf("[") === 0) {
    showSetup();
    return;
  }

  try {
    if (typeof qrcode !== "function") throw new Error("QR library missing");
    var code = qrcode(0, "M");
    code.addData(url);
    code.make();
    qrBox.innerHTML = code.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (error) {
    showSetup("The QR code could not be generated. Check reviewUrl in assets/js/config.js.");
    return;
  }

  if (setupNote) setupNote.hidden = true;
  if (actions) actions.hidden = false;
  if (openLink) openLink.href = url;
  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }
})();