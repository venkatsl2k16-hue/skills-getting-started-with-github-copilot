document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = details.participants && details.participants.length
            ? details.participants.map(p => {
                const label = String(p).split('@')[0] || String(p);
                const parts = label.split(/[^A-Za-z0-9]+/).filter(Boolean);
                const initials = parts.length
                  ? (parts[0][0] || '').toUpperCase() + (parts[1] ? (parts[1][0] || '').toUpperCase() : '')
                  : (label.slice(0,2) || '').toUpperCase();
                // include a delete button with data attributes for activity and email
                return `<li class="participant-item"><span class="avatar">${initials}</span><span class="participant-name">${p}</span><button class="delete-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" title="Unregister">✕</button></li>`;
              }).join('')
            : '<li class="no-participants">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            <ul class="participants-list">
              ${participantsHtml}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Delegate delete button clicks using event listener on activitiesList
          // (we add a single listener below after building cards)

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Event delegation for delete/unregister buttons
  activitiesList.addEventListener('click', async (ev) => {
    const btn = ev.target.closest && ev.target.closest('.delete-btn');
    if (!btn) return;

    const activity = decodeURIComponent(btn.dataset.activity || '');
    const email = decodeURIComponent(btn.dataset.email || '');

    if (!activity || !email) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
      const result = await resp.json();
      if (resp.ok) {
        // refresh the activity list
        fetchActivities();
      } else {
        console.error('Failed to unregister:', result);
        alert(result.detail || 'Failed to unregister participant');
      }
    } catch (err) {
      console.error('Error unregistering:', err);
      alert('Error unregistering participant');
    }
  });
});
