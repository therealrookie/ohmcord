// https://www.w3schools.com/howto/howto_js_snackbar.asp

function showToast(text) {
  // Get the snackbar DIV
  var toast = document.getElementById("snackbar");

  toast.innerHTML = text;

  // Add the "show" class to DIV
  toast.className = "show";

  // After 3 seconds, remove the show class from DIV
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}
