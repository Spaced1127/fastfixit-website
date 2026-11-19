/* FastFixIt Electronics — repair request form */
(function () {
  "use strict";

  var form = document.getElementById("repair-form");
  if (!form) return;

  var config = window.FFI_CONFIG || {};
  var data = window.FFI_DATA || { devices: [] };
  var endpoint = (config.formEndpoint || "").trim();
  var alertBox = form.querySelector("[data-form-alert]");
  var errorList = form.querySelector("[data-error-list]");
  var submitButton = form.querySelector("[type=submit]");
  var submitLabel = submitButton ? submitButton.textContent : "Send repair request";
  var successPanel = document.querySelector("[data-success]");
  var photoInput = document.getElementById("photos");
  var photoField = document.querySelector("[data-photo-field]");
  var photoList = document.querySelector("[data-photo-list]");
  var photoStatus = document.querySelector("[data-photo-status]");
  var prefillNote = document.querySelector("[data-prefill-note]");
  var estimateField = document.getElementById("estimate");
  var startedAt = document.getElementById("startedAt");
  var turnstileWidget = document.getElementById("turnstile-widget");
  var turnstileId = null;
  var turnstileFailed = false;
  var photos = [];
  var mailInFields = document.querySelector("[data-mailin-fields]");
  var handoffRadios = form.querySelectorAll('input[name="handoff"]');
  var mailInFieldIds = ["returnStreet", "returnCity", "returnState", "returnZip", "packingAck"];

  if (startedAt) startedAt.value = String(Date.now());
  if (!endpoint && photoField) photoField.hidden = true;

  /* ------------------------------------------------------------
     Prefill from the bench estimate
     ------------------------------------------------------------ */
  function findDevice(id) {
    for (var i = 0; i < data.devices.length; i++) {
      if (data.devices[i].id === id) return data.devices[i];
    }
    return null;
  }

  function isMailIn() {
    var selected = form.querySelector('input[name="handoff"]:checked');
    return !!selected && selected.value === "Mail it in";
  }

  function syncMailIn() {
    if (!mailInFields) return;
    var on = isMailIn();
    mailInFields.hidden = !on;
    if (!on) mailInFieldIds.forEach(clearError);
  }

  function prefill() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "mail") {
      var mailRadio = document.getElementById("handoff-mail");
      if (mailRadio) mailRadio.checked = true;
    }
    var deviceId = params.get("device");
    var faultId = params.get("fault");
    if (!deviceId) return;

    var device = findDevice(deviceId);
    if (!device) return;

    var deviceSelect = document.getElementById("deviceType");
    if (deviceSelect) deviceSelect.value = device.id;

    var fault = null;
    for (var i = 0; i < device.faults.length; i++) {
      if (device.faults[i].id === faultId) {
        fault = device.faults[i];
        break;
      }
    }

    if (fault) {
      var categorySelect = document.getElementById("faultCategory");
      if (categorySelect) categorySelect.value = fault.category;
      if (estimateField) estimateField.value = device.label + " — " + fault.label;
      if (prefillNote) {
        prefillNote.hidden = false;
        prefillNote.querySelector("[data-prefill-text]").textContent =
          device.label + " — " + fault.label + ".";
      }
    }
  }

  /* ------------------------------------------------------------
     Validation
     ------------------------------------------------------------ */
  function wrapper(id) {
    return form.querySelector('[data-field="' + id + '"]');
  }

  function errorNode(id) {
    var box = wrapper(id);
    return box ? box.querySelector(".field-error") : null;
  }

  function clearError(id) {
    var box = wrapper(id);
    var err = errorNode(id);
    if (!box) return;
    box.classList.remove("has-error");
    var input = box.querySelector("input, select, textarea");
    if (input) {
      input.removeAttribute("aria-invalid");
      var described = input.getAttribute("data-describedby") || "";
      if (described) input.setAttribute("aria-describedby", described);
      else input.removeAttribute("aria-describedby");
    }
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
  }

  function setError(id, message) {
    var box = wrapper(id);
    var err = errorNode(id);
    if (!box || !err) return;
    box.classList.add("has-error");
    err.textContent = message;
    err.hidden = false;
    var input = box.querySelector("input, select, textarea");
    if (input) {
      input.setAttribute("aria-invalid", "true");
      var described = input.getAttribute("aria-describedby") || "";
      if (!input.getAttribute("data-describedby")) input.setAttribute("data-describedby", described);
      input.setAttribute("aria-describedby", (described + " " + err.id).trim());
    }
  }

  function value(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function labelOf(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    if (!el.value) return "Not answered";
    var option = el.options ? el.options[el.selectedIndex] : null;
    return option ? option.text.trim() : "";
  }

  function radioValue(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  function radioLabel(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    if (!el) return "";
    var label = form.querySelector('label[for="' + el.id + '"]');
    return label ? label.textContent.trim() : el.value;
  }

  function validate() {
    var errors = [];
    var name = value("name");
    var email = value("email");
    var phone = value("phone");
    var device = value("deviceType");
    var fault = value("faultCategory");
    var details = value("faultDetails");
    var consent = document.getElementById("consent");

    if (name.length < 2) errors.push(["name", "Add the name we should ask for."]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push(["email", "Add an email address we can reply to."]);
    if (phone && phone.replace(/[^\d]/g, "").length < 7) errors.push(["phone", "That phone number looks too short."]);
    if (!device) errors.push(["deviceType", "Choose the kind of device."]);
    if (!fault) errors.push(["faultCategory", "Choose what it's doing."]);
    if (details.length < 12) errors.push(["faultDetails", "Add a sentence about what it's doing."]);
    if (!consent || !consent.checked) errors.push(["consent", "Confirm we can contact you about this request."]);

    if (isMailIn()) {
      if (value("returnStreet").length < 4) {
        errors.push(["returnStreet", "Add the street address for the return shipment."]);
      }
      if (value("returnCity").length < 2) {
        errors.push(["returnCity", "Add the city."]);
      }
      if (!/^[A-Za-z]{2}$/.test(value("returnState"))) {
        errors.push(["returnState", "Use the two-letter state code."]);
      }
      if (!/^\d{5}(-\d{4})?$/.test(value("returnZip"))) {
        errors.push(["returnZip", "Add a five-digit ZIP code."]);
      }
      var packing = document.getElementById("packingAck");
      if (!packing || !packing.checked) {
        errors.push(["packingAck", "Confirm you'll pack it securely."]);
      }
    }

    var total = photos.reduce(function (sum, item) {
      return sum + item.blob.size;
    }, 0);
    if (photos.length > 3) errors.push(["photos", "Add up to three photos."]);
    if (total > 8 * 1024 * 1024) errors.push(["photos", "Those photos are too large together. Remove one or use smaller files."]);

    return errors;
  }

  function showErrors(errors) {
    ["name", "email", "phone", "deviceType", "faultCategory", "faultDetails", "consent", "photos", "returnStreet", "returnCity", "returnState", "returnZip", "packingAck"].forEach(clearError);

    if (!errors.length) {
      if (alertBox) alertBox.hidden = true;
      return;
    }

    errorList.textContent = "";
    errors.forEach(function (item) {
      setError(item[0], item[1]);
      var li = document.createElement("li");
      var link = document.createElement("a");
      var first = wrapper(item[0]);
      var focusable = first ? first.querySelector("input, select, textarea") : null;
      link.href = focusable && focusable.id ? "#" + focusable.id : "#" + item[0];
      link.textContent = item[1];
      link.addEventListener("click", function (event) {
        event.preventDefault();
        if (focusable) focusable.focus();
      });
      li.appendChild(link);
      errorList.appendChild(li);
    });

    if (alertBox) {
      var alertText = alertBox.querySelector("[data-alert-text]");
      if (alertText) alertText.textContent = "Please check the highlighted fields.";
      alertBox.hidden = false;
      alertBox.focus();
    }
  }

  ["name", "email", "phone", "deviceType", "faultCategory", "faultDetails", "consent", "returnStreet", "returnCity", "returnState", "returnZip", "packingAck"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var clear = function () {
      clearError(id);
    };
    el.addEventListener("input", clear);
    el.addEventListener("change", clear);
  });

  Array.prototype.forEach.call(handoffRadios, function (radio) {
    radio.addEventListener("change", syncMailIn);
  });

  /* ------------------------------------------------------------
     Photos
     ------------------------------------------------------------ */
  function loadBitmap(file) {
    return new Promise(function (resolve, reject) {
      if ("createImageBitmap" in window) {
        createImageBitmap(file).then(resolve).catch(function () {
          loadWithImage(file, resolve, reject);
        });
      } else {
        loadWithImage(file, resolve, reject);
      }
    });
  }

  function loadWithImage(file, resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  }

  function compress(file) {
    return loadBitmap(file).then(function (image) {
      var width = image.width;
      var height = image.height;
      var max = 1600;
      if (width > max || height > max) {
        var scale = Math.min(max / width, max / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      if (image.close) image.close();

      return new Promise(function (resolve, reject) {
        canvas.toBlob(
          function (blob) {
            if (!blob) return reject(new Error("encode"));
            var base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "_").slice(0, 60);
            resolve({ name: base + ".jpg", blob: blob });
          },
          "image/jpeg",
          0.82
        );
      });
    });
  }

  function renderPhotos() {
    if (!photoList) return;
    photoList.textContent = "";
    photos.forEach(function (item, index) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.textContent = item.name + " · " + Math.round(item.blob.size / 1024) + " KB";
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "photo-remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + item.name);
      remove.addEventListener("click", function () {
        photos.splice(index, 1);
        renderPhotos();
        clearError("photos");
      });
      li.appendChild(name);
      li.appendChild(remove);
      photoList.appendChild(li);
    });
  }

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(photoInput.files || []);
      photoInput.value = "";
      if (!files.length) return;

      if (photos.length + files.length > 3) {
        setError("photos", "Add up to three photos. Remove one first.");
        return;
      }

      if (photoStatus) photoStatus.textContent = "Preparing photos…";

      Promise.all(
        files.map(function (file) {
          if (!/^image\//.test(file.type)) {
            return Promise.reject(new Error("That file is not an image."));
          }
          if (file.size > 20 * 1024 * 1024) {
            return Promise.reject(new Error(file.name + " is over 20 MB."));
          }
          return compress(file);
        })
      )
        .then(function (results) {
          results.forEach(function (item) {
            if (photos.length < 3) photos.push(item);
          });
          if (photoStatus) photoStatus.textContent = "";
          renderPhotos();
          clearError("photos");
        })
        .catch(function (error) {
          if (photoStatus) photoStatus.textContent = "";
          setError("photos", error.message || "One of those photos could not be read. Try a JPEG or PNG.");
        });
    });
  }

  function readPhoto(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || "");
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = function () {
        reject(new Error("read"));
      };
      reader.readAsDataURL(blob);
    });
  }

  /* ------------------------------------------------------------
     Turnstile
     ------------------------------------------------------------ */
  function initTurnstile() {
    if (!turnstileWidget || !config.turnstileSiteKey || config.turnstileSiteKey.indexOf("[") !== -1) return;

    var script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = function () {
      if (!window.turnstile) {
        turnstileFailed = true;
        return;
      }
      try {
        turnstileId = window.turnstile.render(turnstileWidget, {
          sitekey: config.turnstileSiteKey,
          theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
          action: "repair-request"
        });
      } catch (error) {
        turnstileFailed = true;
        turnstileWidget.textContent = "Verification could not start. Refresh the page and try again.";
      }
    };
    script.onerror = function () {
      turnstileFailed = true;
      turnstileWidget.textContent = "Verification could not load. Refresh the page, or send the request by email.";
    };
    document.head.appendChild(script);
  }

  /* ------------------------------------------------------------
     Submit
     ------------------------------------------------------------ */
  function setBusy(busy) {
    if (!submitButton) return;
    submitButton.disabled = busy;
    submitButton.setAttribute("aria-busy", busy ? "true" : "false");
    submitButton.textContent = busy ? "Sending…" : submitLabel;
  }

  function showFailure(message) {
    if (!alertBox) return;
    if (errorList) errorList.textContent = "";
    alertBox.hidden = false;
    var p = alertBox.querySelector("[data-alert-text]");
    if (p) p.textContent = message;
    alertBox.focus();
  }

  function buildSummary() {
    var cityLine = [value("returnCity"), value("returnState").toUpperCase()].filter(Boolean).join(", ");
    var returnAddress = [value("returnStreet"), cityLine, value("returnZip")].filter(Boolean).join(", ");

    return {
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      contact: radioLabel("contactMethod"),
      deviceId: value("deviceType"),
      device: labelOf("deviceType"),
      model: value("model"),
      serial: value("serial"),
      faultCategory: value("faultCategory"),
      faultLabel: labelOf("faultCategory"),
      details: value("faultDetails"),
      previous: labelOf("previousWork"),
      liquid: labelOf("liquid"),
      handoff: radioLabel("handoff"),
      estimate: value("estimate"),
      mailIn: isMailIn(),
      returnStreet: value("returnStreet"),
      returnCity: value("returnCity"),
      returnState: value("returnState").toUpperCase(),
      returnZip: value("returnZip"),
      returnAddress: returnAddress,
      shippingCarrier: value("shippingCarrier"),
      trackingNumber: value("trackingNumber"),
      accessories: value("accessories")
    };
  }

  function mailtoFallback(summary) {
    var email = config.email && config.email.indexOf("[") === -1 ? config.email : "";
    if (!email) {
      showFailure("The request form isn't connected yet. Please call or email the shop directly using the details in the contact section.");
      return;
    }
    var lines = [
      "Repair request",
      "",
      "Name: " + summary.name,
      "Email: " + summary.email,
      "Phone: " + (summary.phone || "—"),
      "Preferred contact: " + summary.contact,
      "Device: " + summary.device,
      "Make and model: " + (summary.model || "—"),
      "Serial: " + (summary.serial || "—"),
      "Problem: " + summary.faultLabel,
      "Details: " + summary.details,
      "Worked on before: " + summary.previous,
      "Liquid contact: " + summary.liquid,
      "Drop-off or mail-in: " + summary.handoff
    ];

    if (summary.mailIn) {
      lines.push(
        "Return shipping address: " + (summary.returnAddress || "—"),
        "Carrier: " + (summary.shippingCarrier || "Not shipped yet"),
        "Tracking number: " + (summary.trackingNumber || "—"),
        "Accessories included: " + (summary.accessories || "—")
      );
    }
    var href = "mailto:" + email + "?subject=" + encodeURIComponent("Repair request — " + summary.device + " — " + summary.name) + "&body=" + encodeURIComponent(lines.join("\n"));
    window.location.href = href;
    showFailure("Your email app should open with the request. Send it, and attach any photos there. If nothing opened, email " + email + " directly.");
  }

  async function submit(event) {
    event.preventDefault();
    var errors = validate();
    showErrors(errors);
    if (errors.length) return;

    var summary = buildSummary();
    if (!endpoint) {
      mailtoFallback(summary);
      return;
    }

    if (turnstileId !== null && window.turnstile) {
      var token = window.turnstile.getResponse(turnstileId);
      if (!token) {
        showFailure("Please complete the verification below the form.");
        return;
      }
    } else if (turnstileFailed) {
      showFailure("The spam check could not load. Refresh the page and try again.");
      return;
    }

    setBusy(true);
    if (alertBox) alertBox.hidden = true;

    try {
      var attachments = await Promise.all(
        photos.map(function (item) {
          return readPhoto(item.blob).then(function (data) {
            return { filename: item.name, type: "image/jpeg", data: data };
          });
        })
      );

      var payload = {
        name: summary.name,
        email: summary.email,
        phone: summary.phone,
        contact: summary.contact,
        deviceId: summary.deviceId,
        device: summary.device,
        model: summary.model,
        serial: summary.serial,
        faultCategory: summary.faultCategory,
        faultLabel: summary.faultLabel,
        details: summary.details,
        previous: summary.previous,
        liquid: summary.liquid,
        handoff: summary.handoff,
        estimate: summary.estimate,
        mailIn: summary.mailIn,
        returnStreet: summary.returnStreet,
        returnCity: summary.returnCity,
        returnState: summary.returnState,
        returnZip: summary.returnZip,
        returnAddress: summary.returnAddress,
        shippingCarrier: summary.shippingCarrier,
        trackingNumber: summary.trackingNumber,
        accessories: summary.accessories,
        website: value("website"),
        startedAt: Number(value("startedAt")) || 0,
        turnstileToken: turnstileId !== null && window.turnstile ? window.turnstile.getResponse(turnstileId) : "",
        photos: attachments
      };

      var controller = new AbortController();
      var timer = window.setTimeout(function () {
        controller.abort();
      }, 45000);

      var response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      window.clearTimeout(timer);

      var result = null;
      try {
        result = await response.json();
      } catch (error) {
        result = null;
      }

      if (!response.ok || !result || !result.ok) {
        throw new Error((result && result.error) || "The request could not be sent. Please try again or email us directly.");
      }

      if (successPanel) {
        form.hidden = true;
        successPanel.hidden = false;
        var ref = successPanel.querySelector("[data-success-ref]");
        var email = successPanel.querySelector("[data-success-email]");
        var device = successPanel.querySelector("[data-success-device]");
        if (ref) ref.textContent = result.reference || "—";
        if (email) email.textContent = summary.email;
        if (device) device.textContent = summary.device + " — " + summary.faultLabel;
        var mailinSuccess = successPanel.querySelector("[data-success-mailin]");
        if (mailinSuccess) mailinSuccess.hidden = !summary.mailIn;
        successPanel.focus();
        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        successPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    } catch (error) {
      showFailure(
        error && error.name === "AbortError"
          ? "That took too long. Please try again, or email the shop directly."
          : error.message || "The request could not be sent. Please try again or email us directly."
      );
      if (turnstileId !== null && window.turnstile) window.turnstile.reset(turnstileId);
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener("submit", submit);
  prefill();
  syncMailIn();
  initTurnstile();
})();