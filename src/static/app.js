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

      // Clear loading message and reset activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4 class="activity-name">${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants (${details.participants.length})</h5>
            <div class="participants-list-container"></div>
          </div>
        `;

        // Build participants list as DOM so we can attach delete buttons
        const container = activityCard.querySelector('.participants-list-container');
        if (details.participants.length > 0) {
          const ul = document.createElement('ul');
          details.participants.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-participant';
            btn.title = 'Unregister participant';
            btn.textContent = '✖';
            btn.dataset.activity = name;
            btn.dataset.email = p;
            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              btn.disabled = true;
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, { method: 'POST' });
                const resJson = await resp.json();
                if (resp.ok) {
                  // remove list item
                  li.remove();
                  // update counts and availability text
                  const h5 = activityCard.querySelector('.participants h5');
                  const newCount = parseInt(h5.textContent.match(/\d+/)?.[0] || 0) - 1;
                  h5.textContent = `Participants (${newCount})`;
                  const avail = activityCard.querySelector('.availability');
                  const currentAvail = parseInt(avail.textContent.match(/\d+/)?.[0] || 0) + 1;
                  avail.innerHTML = `<strong>Availability:</strong> ${currentAvail} spots left`;
                  messageDiv.textContent = resJson.message || 'Unregistered';
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to unregister';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                  btn.disabled = false;
                }
              } catch (err) {
                console.error('Error unregistering:', err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                btn.disabled = false;
              }
            });

            li.appendChild(btn);
            ul.appendChild(li);
          });
          container.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.className = 'no-participants';
          p.textContent = 'No participants yet';
          container.appendChild(p);
        }

        activitiesList.appendChild(activityCard);

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
        // Refresh activities to show the newly registered participant
        fetchActivities();
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
});
