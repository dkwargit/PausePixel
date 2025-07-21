document.addEventListener("DOMContentLoaded", () => {
  const dropBox = document.getElementById("dropBox");
  const videoInput = document.getElementById("videoInput");
  const fileNamePreview = document.getElementById("fileNamePreview");

  // Drag and drop handlers
  ["dragenter", "dragover"].forEach(evt =>
    dropBox.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropBox.classList.add("highlight");
    })
  );

  ["dragleave", "drop"].forEach(evt =>
    dropBox.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropBox.classList.remove("highlight");
    })
  );

  dropBox.addEventListener("click", () => videoInput.click());

  dropBox.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      videoInput.files = files;
      fileNamePreview.textContent = files[0].name;
    }
  });

  videoInput.addEventListener("change", () => {
    if (videoInput.files.length > 0) {
      fileNamePreview.textContent = videoInput.files[0].name;
    }
  });

});
