/* FastFixIt Electronics — request inbox */
(function () {
  "use strict";

  var config = window.FFI_CONFIG || {};
  var endpoint = (config.formEndpoint || "").trim();
  var base = endpoint.replace(/\/repair-request\/?$/, "");
  var tokenKey = "ffi-admin-token";

  var tokenForm = document.querySelector("[data-token-form]");
  var tokenInput = document.getElementById("admin-token");
  var alertBox = document.querySelector("[data-admin-alert]");
  var list = document.querySelector("[data-admin-list]");
  var empty = document.querySelector("[data-admin-empty]");
  var actions = document.querySelector("[data-admin-actions]");
  var refreshButton = document.querySelector("[data-admin-refresh]");
  var signoutButton = document.querySelector("[data-admin-signout]");
  var autoToggle = document.querySelector("[data-admin-auto]");

  var token = "";
  var statuses = [
    ["new", "New"],
    ["awaiting-device", "Awaiting device"],
    ["received", "Received"],
    ["diagnosing", "Diagnosing"],
    ["quoted", "Quoted"],
    ["waiting-on-customer", "Waiting on customer"],
    ["approved", "Approved"],
    ["repairing", "Repairing"],
    ["testing", "Testing"],
    ["ready", "Ready"],
    ["shipped", "Shipped"],
    ["closed", "Closed"],
    ["canceled", "Canceled"]
  ];

  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function statusLabel(value) {
    for (var i = 0; i < statuses.length; i += 1) {
      if (statuses[i][0] === value) return statuses[i][1];
    }
    return value || "New";
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  }

  function showAlert(message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.focus();
  }

  function clearAlert() {
    if (!alertBox) return;
    alertBox.hidden = true;
    alertBox.textContent = "";
  }

  function showGate() {
    if (tokenForm) tokenForm.hidden = false;
    if (actions) actions.hidden = true;
    if (list) list.hidden = true;
    if (empty) empty.hidden = true;
  }

  function showInbox() {
    if (tokenForm) tokenForm.hidden = true;
    if (actions) actions.hidden = false;
    if (list) list.hidden = false;
  }

  function addField(parent, label, value, wide) {
    var box = node("div", "admin-field" + (wide ? " admin-field--wide" : ""));
    box.appendChild(node("dt", "", label));
    var dd = node("dd", wide ? "admin-details" : "", value || "—");
    box.appendChild(dd);
    parent.appendChild(box);
  }

  function renderRequests(requests) {
    list.textContent = "";
    empty.hidden = requests.length !== 0;

    requests.forEach(function (request) {
      var card = node("article", "admin-request");
      var head = node("div", "admin-request__head");

      var left = node("div", "admin-meta");
      left.appendChild(node("span", "admin-ref", request.reference));
      left.appendChild(node("span", "admin-request__title", (request.name || "Unnamed") + " · " + (request.device || "Device")));
      left.appendChild(node("span", "admin-request__date", formatDate(request.created_at)));
      head.appendChild(left);

      var right = node("div", "admin-meta");
      if (request.mail_in) right.appendChild(node("span", "admin-mailin", "Mail-in"));
      var badge = node("span", "admin-status-badge", statusLabel(request.status));
      badge.setAttribute("data-status", request.status || "new");
      right.appendChild(badge);
      head.appendChild(right);
      card.appendChild(head);

      var body = node("div", "admin-request__body");
      var fields = node("dl", "admin-fields");

      addField(fields, "Contact", [request.email, request.phone].filter(Boolean).join(" · "));
      addField(fields, "Preferred contact", request.contact);
      addField(fields, "Device", [request.device, request.model].filter(Boolean).join(" · "));
      addField(fields, "Fault", request.fault_label);
      addField(fields, "Handoff", request.handoff);
      addField(fields, "Estimate", request.estimate);
      addField(fields, "Photos", String(request.photo_count || 0));

      if (request.mail_in) {
        addField(fields, "Return address", request.return_address, true);
        addField(fields, "Carrier", request.shipping_carrier || "Not shipped yet");
        addField(fields, "Tracking", request.tracking_number);
        addField(fields, "Accessories", request.accessories);
      }

      addField(fields, "Details", request.details, true);
      body.appendChild(fields);

      var statusRow = node("div", "admin-status-row");
      var statusField = node("div", "field");
      var statusId = "status-" + request.reference;
      var label = node("label", "", "Status");
      label.setAttribute("for", statusId);
      var select = node("select", "");
      select.id = statusId;
      statuses.forEach(function (pair) {
        var option = document.createElement("option");
        option.value = pair[0];
        option.textContent = pair[1];
        if ((request.status || "new") === pair[0]) option.selected = true;
        select.appendChild(option);
      });
      statusField.appendChild(label);
      statusField.appendChild(select);
      statusRow.appendChild(statusField);

      var save = node("button", "btn btn--sm", "Save status");
      save.type = "button";
      statusRow.appendChild(save);
      body.appendChild(statusRow);

      /* Tracker link -------------------------------------------------- */
      var trackerBox = node("div", "admin-tracker");
      var trackerBase = String(config.trackerUrl || "").replace(/\/+$/, "");

      if (request.tracker_ticket_number) {
        var trackerRow = node("div", "admin-tracker__row");
        trackerRow.appendChild(node("span", "admin-tracker__label", "Tracker"));

        var ticketLink = node("a", "admin-tracker__ticket", "Ticket #" + request.tracker_ticket_number);
        if (trackerBase && request.tracker_ticket_id) {
          ticketLink.href = trackerBase + "/app/tickets/" + encodeURIComponent(request.tracker_ticket_id);
          ticketLink.target = "_blank";
          ticketLink.rel = "noopener";
        }
        trackerRow.appendChild(ticketLink);

        if (request.tracker_status) {
          trackerRow.appendChild(node("span", "admin-tracker__status", request.tracker_status));
        }
        trackerBox.appendChild(trackerRow);

        if (request.track_url) {
          var copyRow = node("div", "admin-tracker__row");
          copyRow.appendChild(node("span", "admin-tracker__label", "Customer"));
          var copy = node("button", "btn btn--sm", "Copy status link");
          copy.type = "button";
          copy.addEventListener("click", function () {
            var link = request.track_url;
            var done = function () {
              copy.textContent = "Copied";
              window.setTimeout(function () {
                copy.textContent = "Copy status link";
              }, 1400);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(link).then(done).catch(function () {
                window.prompt("Copy this link", link);
              });
            } else {
              window.prompt("Copy this link", link);
            }
          });
          copyRow.appendChild(copy);
          copyRow.appendChild(node("span", "admin-tracker__note", request.track_url));
          trackerBox.appendChild(copyRow);
        }

        if (request.tracker_error) {
          trackerBox.appendChild(node("p", "admin-tracker__error", request.tracker_error));
        }
      } else {
        var idleRow = node("div", "admin-tracker__row");
        idleRow.appendChild(node("span", "admin-tracker__label", "Tracker"));
        idleRow.appendChild(node("span", "admin-tracker__note", "Not created"));

        var create = node("button", "btn btn--sm", "Create ticket");
        create.type = "button";
        idleRow.appendChild(create);
        trackerBox.appendChild(idleRow);

        if (request.tracker_error) {
          trackerBox.appendChild(node("p", "admin-tracker__error", request.tracker_error));
        }

        create.addEventListener("click", function () {
          clearAlert();
          create.disabled = true;
          create.textContent = "Creating…";

          fetch(base + "/admin/requests/" + encodeURIComponent(request.reference) + "/sync", {
            method: "POST",
            headers: { Authorization: "Bearer " + token }
          })
            .then(function (response) {
              return response.json().then(function (result) {
                return { response: response, result: result };
              });
            })
            .then(function (payload) {
              if (!payload.response.ok || !payload.result || !payload.result.ok) {
                throw new Error((payload.result && payload.result.error) || "Could not create the ticket.");
              }
              return load(token);
            })
            .catch(function (error) {
              showAlert(error.message || "Could not create the ticket.");
              create.textContent = "Create ticket";
              create.disabled = false;
            });
        });
      }

      body.appendChild(trackerBox);
      card.appendChild(body);

      save.addEventListener("click", function () {
        clearAlert();
        save.disabled = true;
        save.textContent = "Saving…";

        fetch(base + "/admin/requests/" + encodeURIComponent(request.reference), {
          method: "PATCH",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: select.value })
        })
          .then(function (response) {
            return response.json().then(function (result) {
              return { response: response, result: result };
            });
          })
          .then(function (payload) {
            if (!payload.response.ok || !payload.result || !payload.result.ok) {
              throw new Error((payload.result && payload.result.error) || "Could not save the status.");
            }
            request.status = payload.result.status;
            badge.textContent = statusLabel(request.status);
            badge.setAttribute("data-status", request.status);
            save.textContent = "Saved";
            window.setTimeout(function () {
              save.textContent = "Save status";
            }, 1400);
          })
          .catch(function (error) {
            showAlert(error.message || "Could not save the status.");
            save.textContent = "Save status";
          })
          .finally(function () {
            save.disabled = false;
          });
      });

      list.appendChild(card);
    });
  }

  function load(currentToken) {
    clearAlert();
    if (!base) {
      showGate();
      showAlert("Set formEndpoint in assets/js/config.js to your Worker URL before using the inbox.");
      return;
    }
    if (!currentToken) {
      showGate();
      return;
    }

    token = currentToken;

    fetch(base + "/admin/requests?limit=100", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(function (response) {
        return response.json().then(function (result) {
          return { response: response, result: result };
        });
      })
      .then(function (payload) {
        if (payload.response.status === 401 || payload.response.status === 403) {
          token = "";
          try {
            sessionStorage.removeItem(tokenKey);
          } catch (error) {
            /* Storage can be unavailable. */
          }
          showGate();
          showAlert("That admin token was rejected. Check the ADMIN_TOKEN secret on the Worker.");
          return;
        }
        if (!payload.response.ok || !payload.result || !payload.result.ok) {
          throw new Error((payload.result && payload.result.error) || "Could not load requests.");
        }
        showInbox();
        renderRequests(payload.result.requests || []);
        loadSettings();
      })
      .catch(function (error) {
        showAlert(error.message || "Could not reach the request inbox.");
      });
  }

  function loadSettings() {
    if (!autoToggle) return;
    fetch(base + "/admin/settings", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(function (response) {
        return response.json().then(function (result) {
          return { response: response, result: result };
        });
      })
      .then(function (payload) {
        if (!payload.response.ok || !payload.result || !payload.result.ok) return;
        autoToggle.checked = Boolean(payload.result.autoCreate);
        if (!payload.result.trackerConfigured) {
          autoToggle.disabled = true;
          autoToggle.parentElement.setAttribute(
            "title",
            "Set TRACKER_URL and the TRACKER_INTAKE_TOKEN secret on the Worker."
          );
        }
      })
      .catch(function () {
        /* Settings are a convenience; the inbox still works without them. */
      });
  }

  if (tokenForm) {
    tokenForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = tokenInput ? tokenInput.value.trim() : "";
      if (!value) {
        if (tokenInput) tokenInput.focus();
        return;
      }
      try {
        sessionStorage.setItem(tokenKey, value);
      } catch (error) {
        /* The page still loads for this tab. */
      }
      load(value);
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", function () {
      load(token);
    });
  }

  if (autoToggle) {
    autoToggle.addEventListener("change", function () {
      clearAlert();
      autoToggle.disabled = true;

      fetch(base + "/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ autoCreate: autoToggle.checked })
      })
        .then(function (response) {
          return response.json().then(function (result) {
            return { response: response, result: result };
          });
        })
        .then(function (payload) {
          if (!payload.response.ok || !payload.result || !payload.result.ok) {
            throw new Error((payload.result && payload.result.error) || "Could not save the setting.");
          }
          autoToggle.checked = Boolean(payload.result.autoCreate);
        })
        .catch(function (error) {
          autoToggle.checked = !autoToggle.checked;
          showAlert(error.message || "Could not save the setting.");
        })
        .finally(function () {
          autoToggle.disabled = false;
        });
    });
  }

  if (signoutButton) {
    signoutButton.addEventListener("click", function () {
      token = "";
      try {
        sessionStorage.removeItem(tokenKey);
      } catch (error) {
        /* Storage can be unavailable. */
      }
      if (tokenInput) tokenInput.value = "";
      if (list) list.textContent = "";
      showGate();
      if (tokenInput) tokenInput.focus();
    });
  }

  var saved = "";
  try {
    saved = sessionStorage.getItem(tokenKey) || "";
  } catch (error) {
    saved = "";
  }
  if (saved) load(saved);
})();