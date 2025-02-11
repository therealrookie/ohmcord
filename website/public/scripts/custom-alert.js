function addAlert(heading, text, duration) {
  const customAlert = document.createElement("div");
  customAlert.classList.add("custom-alert");
  const headingText = document.createElement("h3");
  headingText.innerHTML = heading;
  const alertText = document.createElement("p");
  alertText.innerHTML = text;

  customAlert.appendChild(headingText);
  customAlert.appendChild(alertText);
  document.body.appendChild(customAlert);

  // Force a reflow to apply transition
  requestAnimationFrame(() => {
    customAlert.classList.add("show");
  });

  setTimeout(() => {
    customAlert.classList.add("hide");

    // Wait for transition to complete before removing
    setTimeout(() => {
      customAlert.remove();
    }, 300);
  }, duration); // Adjust time as needed
}
