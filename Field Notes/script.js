import "../Web%20Pages/app.js";

const form = document.getElementById("newsletterForm");
const status = document.getElementById("newsletterStatus");

form?.addEventListener("submit", event => {
  event.preventDefault();
  status.textContent = "Thanks for subscribing to Field Notes.";
  form.reset();
});