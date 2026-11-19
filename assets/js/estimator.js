/* FastFixIt Electronics — bench estimate */
(function () {
  "use strict";

  var root = document.querySelector("[data-estimator]");
  var data = window.FFI_DATA;
  if (!root || !data) return;

  var deviceWrap = root.querySelector("[data-device-chips]");
  var faultWrap = root.querySelector("[data-fault-chips]");
  var hint = root.querySelector("[data-fault-hint]");
  var status = root.parentElement.querySelector("[data-estimate-status]");

  var ticket = {
    device: root.querySelector("[data-ticket-device]"),
    fault: root.querySelector("[data-ticket-fault]"),
    check: root.querySelector("[data-ticket-check]"),
    time: root.querySelector("[data-ticket-time]"),
    price: root.querySelector("[data-ticket-price]"),
    cta: root.querySelector("[data-ticket-cta]")
  };

  var state = {
    device: data.devices[0] || null,
    fault: null
  };

  if (state.device && state.device.faults.length === 1) {
    state.fault = state.device.faults[0];
  }

  function button(label, id, pressed, className) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = className;
    el.textContent = label;
    el.setAttribute("data-id", id);
    el.setAttribute("aria-pressed", pressed ? "true" : "false");
    return el;
  }

  function renderDevices() {
    deviceWrap.textContent = "";
    data.devices.forEach(function (device) {
      var selected = state.device && state.device.id === device.id;
      var el = button(device.label, device.id, selected, "chip");
      el.addEventListener("click", function () {
        if (state.device && state.device.id === device.id) return;
        state.device = device;
        state.fault = device.faults.length === 1 ? device.faults[0] : null;
        renderDevices();
        renderFaults();
        update();
      });
      deviceWrap.appendChild(el);
    });
  }

  function renderFaults() {
    faultWrap.textContent = "";
    if (!state.device) return;

    state.device.faults.forEach(function (fault) {
      var selected = state.fault && state.fault.id === fault.id;
      var el = button(fault.label, fault.id, selected, "chip");
      el.addEventListener("click", function () {
        if (state.fault && state.fault.id === fault.id) return;
        state.fault = fault;
        renderFaults();
        update();
      });
      faultWrap.appendChild(el);
    });

    if (hint) {
      hint.textContent = state.fault
        ? "Not quite it? Pick the closest one. The request form has room for the detail."
        : "Choose the closest symptom. Nothing is sent until you ask us to look at it.";
    }
  }

  function formatPrice(value) {
    return value == null ? "Quoted after inspection" : "From $" + value + " + parts";
  }

  function update() {
    var device = state.device;
    var fault = state.fault;

    ticket.device.textContent = device ? device.label : "—";
    ticket.fault.textContent = fault ? fault.label : "Choose a symptom";
    ticket.check.textContent = fault ? fault.check : "—";
    ticket.time.textContent = fault ? fault.time : "—";
    ticket.price.textContent = fault ? formatPrice(fault.from) : "—";

    if (fault) {
      ticket.cta.textContent = "Request this repair";
      ticket.cta.href = "request.html?device=" + encodeURIComponent(device.id) + "&fault=" + encodeURIComponent(fault.id) + "#request-form";
      if (status) {
        status.textContent =
          "Estimate updated: " + device.label + ", " + fault.label + ". Price " +
          (fault.from == null ? "quoted after inspection" : "from $" + fault.from + " plus parts") +
          ". Typical bench time " + fault.time + " after approval.";
      }
    } else {
      ticket.cta.textContent = "Start a repair";
      ticket.cta.href = "request.html#request-form";
      if (status) {
        status.textContent = device
          ? "Device selected: " + device.label + ". Choose a symptom to see the estimate."
          : "Choose a device to see the estimate.";
      }
    }
  }

  renderDevices();
  renderFaults();
  update();
})();