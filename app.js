document.addEventListener("DOMContentLoaded", () => {
  const termSelect = document.getElementById("term-select");

  if (!termSelect) {
    console.error(
      "Search select dropdown (#term-select) not found on the page."
    );
    return;
  }

  const populateDropdown = async () => {
    try {
      // Fetch the curated list of terms from the static JSON file in the public folder.
      const response = await fetch("public/terms.json");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const terms = await response.json();

      // Clear the initial "Loading..." option
      termSelect.innerHTML = "";

      // Add a default placeholder option that is disabled
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "Select a high-value term...";
      defaultOption.value = "";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      termSelect.appendChild(defaultOption);

      // Populate the dropdown with the fetched terms
      for (const term of terms) {
        const option = document.createElement("option");
        option.value = term;
        option.textContent = term;
        termSelect.appendChild(option);
      }
    } catch (error) {
      console.error("Failed to fetch or populate terms:", error);
      // Update the UI to inform the user that loading failed.
      termSelect.innerHTML =
        '<option value="" disabled selected>Error: Could not load terms</option>';
    }
  };

  populateDropdown();
});
