// ================================
// SECURE NOTES SECURITY CENTER
// COMPLETE app.js
// ================================

console.log("SECURE NOTES APP STARTED");


// ========================================
// CONFIG
// ========================================

const API_URL =
  "add this";

const METRICS_API =
  "add this";

const COGNITO_DOMAIN =
  "add this";

const CLIENT_ID =
  "add this";

const REDIRECT_URI =
  "add this";


// ========================================
// GLOBAL VARIABLES
// ========================================

let selectedNoteId = null;


// ========================================
// HANDLE LOGIN REDIRECT
// ========================================

const hash = window.location.hash;

if (hash.includes("id_token")) {

  const params =
    new URLSearchParams(hash.substring(1));

  const token =
    params.get("id_token");

  localStorage.setItem("token", token);

  window.location.hash = "";

  location.reload();
}


// ========================================
// TOKEN
// ========================================

const token =
  localStorage.getItem("token");


// ========================================
// PAGE LOAD
// ========================================

document.addEventListener("DOMContentLoaded", () => {

  if (token) {

    loadNotes();

    loadUnauthorizedAttempts();

    extractUserInfo();

    addSecurityEvent(
      "✓ Authorized user logged in",
      "success"
    );

  } else {

    showLoginScreen();
  }
});


// ========================================
// SHOW LOGIN SCREEN
// ========================================

function showLoginScreen() {

  document.body.innerHTML = `

    <div style="
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
      background:#081120;
      color:white;
      flex-direction:column;
      font-family:Arial;
    ">

      <h1 style="margin-bottom:20px;">
        Secure Notes Security Center
      </h1>

      <button
        onclick="login()"
        style="
          padding:15px 30px;
          border:none;
          border-radius:10px;
          background:#00b36b;
          color:white;
          font-size:18px;
          cursor:pointer;
        "
      >
        Login with Cognito
      </button>

    </div>
  `;
}


// ========================================
// LOGIN
// ========================================

function login() {

  const loginUrl =
    `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${REDIRECT_URI}`;

  window.location.href = loginUrl;
}


// ========================================
// LOGOUT
// ========================================

function logout() {

  localStorage.removeItem("token");

  location.reload();
}


// ========================================
// EXTRACT USER EMAIL
// ========================================

function extractUserInfo() {

  try {

    const payload =
      JSON.parse(atob(token.split(".")[1]));

    const email =
      payload.email || "Authorized User";

    const emailElement =
      document.getElementById("userEmail");

    if (emailElement) {

      emailElement.innerText = email;
    }

  } catch (err) {

    console.error("USER INFO ERROR:", err);
  }
}


// ========================================
// SECURITY EVENT LOGGER
// ========================================

function addSecurityEvent(message, type = "info") {

  const eventsContainer =
    document.getElementById("securityEvents");

  if (!eventsContainer) return;

  const event =
    document.createElement("div");

  event.className =
    `securityEvent ${type}`;

  event.innerHTML = message;

  eventsContainer.prepend(event);

  if (eventsContainer.children.length > 6) {

    eventsContainer.removeChild(
      eventsContainer.lastChild
    );
  }
}


// ========================================
// CREATE NOTE
// ========================================

async function createNote() {

  const content =
    document.getElementById("noteInput").value;

  if (!content.trim()) {

    showAlert("Write note first", "error");
    return;
  }

  try {

    const response = await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },

      body: JSON.stringify({
        content
      })
    });

    const data =
      await response.json();

    console.log("CREATE RESPONSE:", data);

    if (!response.ok) {

      if (
        data.message &&
        data.message.includes("Access denied")
      ) {

        showUnauthorizedAccess();

      } else {

        showAlert(
          "Server error occurred",
          "error"
        );
      }

      return;
    }

    document.getElementById("noteInput").value = "";

    selectedNoteId = null;

    showAlert(
      "Secure note saved",
      "success"
    );

    addSecurityEvent(
      "✓ Secure note encrypted and saved",
      "success"
    );

    loadNotes();

  } catch (err) {

    console.error("POST ERROR:", err);

    showAlert(
      "Network/server error",
      "error"
    );
  }
}


// ========================================
// LOAD NOTES
// ========================================

async function loadNotes() {

  try {

    const response = await fetch(API_URL, {

      method: "GET",

      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const notes =
      await response.json();

    console.log("GET RESPONSE:", notes);

    if (!response.ok) {

      if (
        notes.message &&
        notes.message.includes("Access denied")
      ) {

        showUnauthorizedAccess();

      } else {

        showAlert(
          "Unable to load notes",
          "error"
        );
      }

      return;
    }

    const container =
      document.getElementById("notesContainer");

    if (!Array.isArray(notes)) {

      console.error("NOT ARRAY:", notes);

      return;
    }

    container.innerHTML = "";

    notes.forEach(note => {

      container.innerHTML += `

        <div class="noteCard">

          <div
            class="notePreview"
            onclick="selectNote(
              '${note.noteId}',
              \`${note.content}\`
            )"
          >
            ${note.content.substring(0, 100)}
          </div>

          <div class="noteDate">
            ${new Date(
              note.createdAt
            ).toLocaleString()}
          </div>

          <div class="noteActions">

            <button
              class="updateBtn"
              onclick="selectNote(
                '${note.noteId}',
                \`${note.content}\`
              )"
            >
              Edit
            </button>

            <button
              class="deleteBtn"
              onclick="deleteNote(
                '${note.noteId}'
              )"
            >
              Delete
            </button>

          </div>

        </div>
      `;
    });

  } catch (err) {

    console.error("GET ERROR:", err);

    showAlert(
      "Failed loading notes",
      "error"
    );
  }
}


// ========================================
// LOAD UNAUTHORIZED ATTEMPTS
// ========================================

async function loadUnauthorizedAttempts() {

  try {

    const response = await fetch(
      METRICS_API,
      {
        method: "GET"
      }
    );

    const data =
      await response.json();

    console.log(
      "METRICS RESPONSE:",
      data
    );

    const box =
      document.getElementById(
        "unauthorizedCount"
      );

    if (!box) return;

    box.innerHTML =
      data.count || 0;

  } catch (err) {

    console.error(
      "METRICS ERROR:",
      err
    );

    const box =
      document.getElementById(
        "unauthorizedCount"
      );

    if (box) {

      box.innerHTML = "0";
    }
  }
}


// ========================================
// SELECT NOTE
// ========================================

function selectNote(id, content) {

  selectedNoteId = id;

  document.getElementById(
    "noteInput"
  ).value = content;

  showAlert(
    "Note selected for update",
    "success"
  );

  addSecurityEvent(
    "✓ Secure note selected for editing",
    "info"
  );
}


// ========================================
// UPDATE SELECTED NOTE
// ========================================

async function updateSelectedNote() {

  if (!selectedNoteId) {

    showAlert(
      "Select note first",
      "error"
    );

    return;
  }

  const newContent =
    document.getElementById("noteInput").value;

  if (!newContent.trim()) {

    showAlert(
      "Write updated note",
      "error"
    );

    return;
  }

  try {

    const response =
      await fetch(
        `${API_URL}/${selectedNoteId}`,
        {

          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "Authorization":
              "Bearer " + token
          },

          body: JSON.stringify({
            content: newContent
          })
        }
      );

    const data =
      await response.json();

    console.log("UPDATE RESPONSE:", data);

    if (!response.ok) {

      showAlert(
        "Update failed",
        "error"
      );

      return;
    }

    selectedNoteId = null;

    document.getElementById(
      "noteInput"
    ).value = "";

    showAlert(
      "Note updated successfully",
      "success"
    );

    addSecurityEvent(
      "✓ Secure note updated",
      "info"
    );

    loadNotes();

  } catch (err) {

    console.error("UPDATE ERROR:", err);

    showAlert(
      "Server error during update",
      "error"
    );
  }
}


// ========================================
// DELETE NOTE
// ========================================

async function deleteNote(id) {

  try {

    const response =
      await fetch(`${API_URL}/${id}`, {

        method: "DELETE",

        headers: {
          "Authorization":
            "Bearer " + token
        }
      });

    const data =
      await response.json();

    console.log("DELETE RESPONSE:", data);

    if (!response.ok) {

      showAlert(
        "Delete failed",
        "error"
      );

      return;
    }

    showAlert(
      "Note deleted",
      "success"
    );

    addSecurityEvent(
      "⚠ Secure note deleted",
      "warning"
    );

    loadNotes();

  } catch (err) {

    console.error("DELETE ERROR:", err);

    showAlert(
      "Server error during delete",
      "error"
    );
  }
}


// ========================================
// ALERT POPUP
// ========================================

function showAlert(message, type) {

  const alertBox =
    document.getElementById("alertBox");

  if (!alertBox) return;

  alertBox.innerHTML = `

    <div class="
      alert
      ${type === "error"
        ? "alertError"
        : "alertSuccess"}
    ">

      ${message}

    </div>
  `;

  setTimeout(() => {

    alertBox.innerHTML = "";

  }, 3000);
}


// ========================================
// UNAUTHORIZED ACCESS SCREEN
// ========================================

function showUnauthorizedAccess() {

  addSecurityEvent(
    "⚠ Unauthorized access blocked",
    "warning"
  );

  document.body.innerHTML = `

    <div style="
      background:#081120;
      color:white;
      height:100vh;
      display:flex;
      justify-content:center;
      align-items:center;
      flex-direction:column;
      font-family:Arial;
      padding:30px;
      text-align:center;
    ">

      <h1 style="
        color:#ff4d4d;
        margin-bottom:20px;
        font-size:45px;
      ">
        🚫 ACCESS DENIED
      </h1>

      <p style="
        font-size:22px;
        margin-bottom:20px;
      ">
        Unauthorized user detected
      </p>

      <p style="
        color:#8ca0c0;
        margin-bottom:40px;
        max-width:700px;
      ">
        Your access attempt has been logged,
        monitored through CloudWatch,
        and security alerts were triggered
        using AWS SNS monitoring pipeline.
      </p>

      <button
        onclick="logout()"
        style="
          padding:14px 30px;
          border:none;
          border-radius:10px;
          background:#ff4d4d;
          color:white;
          font-size:18px;
          cursor:pointer;
        "
      >
        Logout
      </button>

    </div>
  `;
}
