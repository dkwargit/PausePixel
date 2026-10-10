/**
 * PausePixel - Interactive Full-Stack Client Controller
 * Manages video previews, asynchronous processing, real-time progress HUD,
 * dynamic gallery rendering, interactive lightbox modals, and error popups.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Studio & Upload
  const dropBox = document.getElementById("dropBox");
  const videoInput = document.getElementById("videoInput");
  const dropPrompt = document.getElementById("dropPrompt");
  const fileInfoBadge = document.getElementById("fileInfoBadge");
  const fileNamePreview = document.getElementById("fileNamePreview");
  const fileSizePreview = document.getElementById("fileSizePreview");
  const clearFileBtn = document.getElementById("clearFileBtn");
  const uploadForm = document.getElementById("uploadForm");
  const processBtn = document.getElementById("processBtn");

  // Video Preview Elements
  const videoPreviewWrapper = document.getElementById("videoPreviewWrapper");
  const videoPreview = document.getElementById("videoPreview");
  const playheadTime = document.getElementById("playheadTime");
  const videoDurationEl = document.getElementById("videoDuration");
  const btnSetStart = document.getElementById("btnSetStart");
  const btnSetEnd = document.getElementById("btnSetEnd");

  // Timing & Interval Inputs
  const startTimeInput = document.getElementById("start_time");
  const endTimeInput = document.getElementById("end_time");
  const intervalInput = document.getElementById("intervalSelect");
  const presetChips = document.querySelectorAll(".chip-preset");
  const estimateText = document.getElementById("estimateText");

  // Monitor Section Elements
  const studioSection = document.getElementById("studioSection");
  const monitorSection = document.getElementById("monitorSection");
  const monitorStatusText = document.getElementById("monitorStatusText");
  const progressPhase = document.getElementById("progressPhase");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressBar = document.getElementById("progressBar");
  const liveSavedCount = document.getElementById("liveSavedCount");
  const liveCurrentFrame = document.getElementById("liveCurrentFrame");
  const liveTotalFrames = document.getElementById("liveTotalFrames");
  const liveFps = document.getElementById("liveFps");
  const cancelJobBtn = document.getElementById("cancelJobBtn");

  // Gallery Elements
  const gallerySection = document.getElementById("gallerySection");
  const screenshotsGrid = document.getElementById("screenshotsGrid");
  const screenshotCountBadge = document.getElementById("screenshotCountBadge");
  const downloadZipBtn = document.getElementById("downloadZipBtn");
  const openFolderBtn = document.getElementById("openFolderBtn");

  // Lightbox Elements
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxCloseBtn = document.getElementById("lightboxCloseBtn");
  const lightboxDownloadBtn = document.getElementById("lightboxDownloadBtn");
  const lightboxPrevBtn = document.getElementById("lightboxPrevBtn");
  const lightboxNextBtn = document.getElementById("lightboxNextBtn");

  // Error Modal Elements
  const errorModal = document.getElementById("errorModal");
  const errorModalBackdrop = document.getElementById("errorModalBackdrop");
  const errorModalImage = document.getElementById("errorModalImage");
  const errorModalTitle = document.getElementById("errorModalTitle");
  const errorModalMessage = document.getElementById("errorModalMessage");
  const errorModalDismissBtn = document.getElementById("errorModalDismissBtn");
  const errorModalPageLink = document.getElementById("errorModalPageLink");

  // State
  let activeVideoFile = null;
  let activeVideoDuration = 0;
  let activeJobId = null;
  let pollInterval = null;
  let galleryImages = [];
  let currentLightboxIndex = 0;

  // ==========================================
  // Toast Notifications
  // ==========================================
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ==========================================
  // Error Modal Pop-up Handlers
  // ==========================================
  function showErrorPopup({ type = "no_video", title = "Oopsie!", message = "", image = "" }) {
    if (!errorModal) return;

    errorModalTitle.textContent = title;
    errorModalMessage.textContent = message;

    const defaultImg = (type === "invalid_timing" || message.toLowerCase().includes("timing"))
      ? "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png" 
      : "/static/assets/mb_mock.png";

    const imgSrc = image || defaultImg;
    errorModalImage.src = imgSrc;

    if (imgSrc.includes("Microsoft-Fluentui-Emoji")) {
      errorModalImage.classList.add("emoji-mode");
    } else {
      errorModalImage.classList.remove("emoji-mode");
    }

    if (errorModalPageLink) {
      errorModalPageLink.href = `/error?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message)}`;
    }

    errorModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function hideErrorPopup() {
    if (errorModal) {
      errorModal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  if (errorModalDismissBtn) errorModalDismissBtn.addEventListener("click", hideErrorPopup);
  if (errorModalBackdrop) errorModalBackdrop.addEventListener("click", hideErrorPopup);

  // ==========================================
  // File Drop & Selection Handlers
  // ==========================================
  function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function handleFileSelected(file) {
    if (!file) return;

    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mkv|mov|avi|webm|flv)$/i)) {
      showErrorPopup({
        type: "invalid_format",
        title: "Unsupported Video Format",
        message: "Please choose a valid video file (.mp4, .mkv, .mov, .webm, .avi).",
        image: "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
      });
      return;
    }

    activeVideoFile = file;
    fileNamePreview.textContent = file.name;
    fileSizePreview.textContent = formatBytes(file.size);

    dropPrompt.style.display = "none";
    fileInfoBadge.style.display = "flex";

    // Setup Local Video Preview
    const objectUrl = URL.createObjectURL(file);
    videoPreview.src = objectUrl;
    videoPreviewWrapper.style.display = "flex";

    videoPreview.onloadedmetadata = () => {
      activeVideoDuration = videoPreview.duration || 0;
      videoDurationEl.textContent = `${activeVideoDuration.toFixed(1)}s`;
      endTimeInput.placeholder = activeVideoDuration.toFixed(1);
      updateEstimate();
    };

    updateEstimate();
  }

  function clearSelectedFile() {
    activeVideoFile = null;
    videoInput.value = "";
    if (videoPreview.src) {
      URL.revokeObjectURL(videoPreview.src);
      videoPreview.src = "";
    }
    dropPrompt.style.display = "block";
    fileInfoBadge.style.display = "none";
    videoPreviewWrapper.style.display = "none";
    activeVideoDuration = 0;
    updateEstimate();
  }

  // Drag and drop event bindings
  ["dragenter", "dragover"].forEach(evt => {
    dropBox.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropBox.classList.add("drag-active");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dropBox.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropBox.classList.remove("drag-active");
    });
  });

  dropBox.addEventListener("click", (e) => {
    if (e.target.closest("#clearFileBtn") || e.target.closest(".file-info-badge")) {
      return;
    }
    videoInput.click();
  });

  dropBox.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      videoInput.files = files;
      handleFileSelected(files[0]);
    }
  });

  videoInput.addEventListener("change", () => {
    if (videoInput.files.length > 0) {
      handleFileSelected(videoInput.files[0]);
    }
  });

  clearFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  // ==========================================
  // Video Scrubber & Preset Controls
  // ==========================================
  videoPreview.addEventListener("timeupdate", () => {
    playheadTime.textContent = `${videoPreview.currentTime.toFixed(1)}s`;
  });

  btnSetStart.addEventListener("click", () => {
    const time = videoPreview.currentTime.toFixed(1);
    startTimeInput.value = time;
    showToast(`Start time set to ${time}s`, "info");
    updateEstimate();
  });

  btnSetEnd.addEventListener("click", () => {
    const time = videoPreview.currentTime.toFixed(1);
    endTimeInput.value = time;
    showToast(`End time set to ${time}s`, "info");
    updateEstimate();
  });

  presetChips.forEach(chip => {
    chip.addEventListener("click", () => {
      presetChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      intervalInput.value = chip.dataset.val;
      updateEstimate();
    });
  });

  [startTimeInput, endTimeInput, intervalInput].forEach(inp => {
    inp.addEventListener("input", updateEstimate);
  });

  function updateEstimate() {
    const start = parseFloat(startTimeInput.value) || 0;
    let end = parseFloat(endTimeInput.value);
    if (isNaN(end) || end <= 0) {
      end = activeVideoDuration > 0 ? activeVideoDuration : 0;
    }
    const interval = parseFloat(intervalInput.value) || 1.0;

    if (end > start && interval > 0) {
      const estimatedCount = Math.floor((end - start) / interval) + 1;
      estimateText.innerHTML = `Estimated yield: <strong>~${estimatedCount} screenshots</strong>`;
    } else {
      estimateText.innerHTML = `Estimated yield: <strong>~0 screenshots</strong>`;
    }
  }

  // ==========================================
  // Form Submission & Real-time Polling
  // ==========================================
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Check if video file is present
    if (!activeVideoFile && (!videoInput.files || videoInput.files.length === 0)) {
      showErrorPopup({
        type: "no_video",
        title: "No Video Uploaded!",
        message: "No video uploaded! At least give me something to work with. Duh!! 😐",
        image: "/static/assets/mb_mock.png"
      });
      return;
    }

    const startVal = parseFloat(startTimeInput.value) || 0;
    const endVal = parseFloat(endTimeInput.value);
    const intervalVal = parseFloat(intervalInput.value) || 1.0;

    if (startVal < 0) {
      showErrorPopup({
        type: "invalid_timing",
        title: "Invalid Timing Inputs!",
        message: "Start time cannot be negative. Please enter a valid non-negative second timestamp.",
        image: "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
      });
      return;
    }

    if (!isNaN(endVal) && endVal <= startVal) {
      showErrorPopup({
        type: "invalid_timing",
        title: "Invalid Timing Inputs!",
        message: "End time must be greater than start time. What are these numbers even supposed to mean? 🤨",
        image: "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
      });
      return;
    }

    if (intervalVal <= 0) {
      showErrorPopup({
        type: "invalid_timing",
        title: "Invalid Timing Inputs!",
        message: "Capture interval must be greater than 0 seconds.",
        image: "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
      });
      return;
    }

    // Prepare FormData
    const formData = new FormData(uploadForm);
    if (activeVideoFile && !videoInput.files.length) {
      formData.set("video", activeVideoFile);
    }

    try {
      processBtn.disabled = true;
      processBtn.innerHTML = `<span>⏳ Uploading Video...</span>`;

      // Dispatch to API
      const response = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });

      const result = await response.json();

      if (!response.ok) {
        showErrorPopup({
          type: result.error_type || "general",
          title: result.error_type === "no_video" ? "No Video Uploaded!" : "Invalid Timing Inputs!",
          message: result.error || "Failed to start extraction job.",
          image: result.image || "/static/assets/mb_mock.png"
        });
        processBtn.disabled = false;
        processBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-text">⚡ Start Screenshot Extraction</span>`;
        return;
      }

      activeJobId = result.job_id;
      const folderName = result.folder_name;

      // Switch view to progress monitor
      studioSection.style.display = "none";
      monitorSection.style.display = "flex";
      monitorSection.scrollIntoView({ behavior: "smooth" });

      startStatusPolling(activeJobId, folderName);

    } catch (err) {
      showErrorPopup({
        type: "general",
        title: "Connection Error",
        message: err.message || "Failed to contact the processing server.",
        image: "/static/assets/mb_mock.png"
      });
      processBtn.disabled = false;
      processBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-text">⚡ Start Screenshot Extraction</span>`;
    }
  });

  // Polling loop for job status
  function startStatusPolling(jobId, folderName) {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;

        const data = await res.json();

        // Update Progress UI
        const progress = Math.min(100, Math.max(0, data.progress || 0));
        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;

        liveSavedCount.textContent = data.saved_count || 0;
        liveCurrentFrame.textContent = data.current_frame || 0;
        liveTotalFrames.textContent = data.total_frames || "--";
        liveFps.textContent = data.fps ? `${data.fps} fps` : "--";

        if (data.status === "processing") {
          monitorStatusText.textContent = `Extracting frames (${progress}%)...`;
          progressPhase.textContent = `Captured ${data.saved_count || 0} screenshots so far`;
        } else if (data.status === "completed") {
          clearInterval(pollInterval);
          monitorStatusText.textContent = "Extraction Complete!";
          progressPhase.textContent = "All requested frames extracted successfully.";
          progressBar.style.width = "100%";
          progressPercentage.textContent = "100%";

          showToast(`Extracted ${data.saved_count} screenshots successfully!`, "success");

          // Load screenshots into gallery
          setTimeout(() => {
            loadCompletedGallery(jobId, folderName);
          }, 600);

        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          monitorStatusText.textContent = "Processing Failed";
          showErrorPopup({
            type: "general",
            title: "Extraction Failed",
            message: data.error_message || "An error occurred during video extraction.",
            image: "/static/assets/mb_mock.png"
          });
          setTimeout(() => {
            monitorSection.style.display = "none";
            studioSection.style.display = "block";
            processBtn.disabled = false;
            processBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-text">⚡ Start Screenshot Extraction</span>`;
          }, 2000);

        } else if (data.status === "cancelled") {
          clearInterval(pollInterval);
          showToast("Job was cancelled.", "info");
          setTimeout(() => {
            monitorSection.style.display = "none";
            studioSection.style.display = "block";
            processBtn.disabled = false;
            processBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-text">⚡ Start Screenshot Extraction</span>`;
          }, 1500);
        }

      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 450);
  }

  // Cancel job button
  cancelJobBtn.addEventListener("click", async () => {
    if (!activeJobId) return;
    try {
      await fetch(`/api/jobs/${activeJobId}/cancel`, { method: "POST" });
      showToast("Cancellation requested...", "info");
    } catch (e) {
      console.error(e);
    }
  });

  // ==========================================
  // Gallery Rendering & Integrations
  // ==========================================
  async function loadCompletedGallery(jobId, folderName) {
    try {
      const res = await fetch(`/api/jobs/${jobId}/screenshots`);
      const data = await res.json();
      const screenshots = data.screenshots || [];

      // Update URL silently
      window.history.pushState(null, "", `/screenshots/${folderName}`);

      monitorSection.style.display = "none";
      gallerySection.style.display = "flex";
      screenshotCountBadge.textContent = `${screenshots.length} Images`;

      // Update action links
      if (downloadZipBtn) {
        downloadZipBtn.href = `/download_zip/${folderName}`;
      }
      if (openFolderBtn) {
        openFolderBtn.href = `/open_folder/${folderName}`;
      }

      // Render items
      screenshotsGrid.innerHTML = "";
      galleryImages = [];

      screenshots.forEach((item) => {
        const imgUrl = item.url || `/static/screenshots/${folderName}/${item.filename}`;
        galleryImages.push({ src: imgUrl, name: item.filename });

        const card = document.createElement("div");
        card.className = "screenshot-item";
        card.setAttribute("data-src", imgUrl);
        card.innerHTML = `
          <div class="image-wrapper">
            <img src="${imgUrl}" alt="${item.filename}" loading="lazy" />
            <div class="image-overlay">
              <button type="button" class="btn-quick-view" title="Preview Fullscreen">🔍</button>
              <a href="${imgUrl}" download="${item.filename}" class="btn-quick-download" title="Download Image">⬇️</a>
            </div>
          </div>
          <div class="item-footer">
            <span class="file-name mono-text">${item.filename}</span>
          </div>
        `;
        screenshotsGrid.appendChild(card);
      });

      attachGalleryListeners();
      gallerySection.scrollIntoView({ behavior: "smooth" });

    } catch (e) {
      console.error("Error loading gallery:", e);
    }
  }

  function attachGalleryListeners() {
    const items = document.querySelectorAll(".screenshot-item");
    galleryImages = [];

    items.forEach((item, index) => {
      const src = item.getAttribute("data-src");
      const name = item.querySelector(".file-name")?.textContent || `Image ${index + 1}`;
      galleryImages.push({ src, name });

      // Click card or quick view button to open Lightbox
      item.addEventListener("click", (e) => {
        if (e.target.closest(".btn-quick-download")) return;
        openLightbox(index);
      });
    });
  }

  // Handle native "Open Local Folder" button
  if (openFolderBtn) {
    openFolderBtn.addEventListener("click", async (e) => {
      const href = openFolderBtn.getAttribute("href");
      if (href && href.startsWith("/open_folder/")) {
        e.preventDefault();
        try {
          const res = await fetch(href, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
          });
          const result = await res.json();
          if (result.success) {
            showToast("Opening folder in your file manager...", "success");
          } else {
            showToast("Could not open folder on host.", "error");
          }
        } catch (err) {
          // Fallback to normal navigation
          window.location.href = href;
        }
      }
    });
  }

  // ==========================================
  // Lightbox Modal Controls
  // ==========================================
  function openLightbox(index) {
    if (!galleryImages.length || index < 0 || index >= galleryImages.length) return;
    currentLightboxIndex = index;
    const current = galleryImages[index];

    lightboxImage.src = current.src;
    lightboxCaption.textContent = current.name;
    lightboxDownloadBtn.href = current.src;
    lightboxDownloadBtn.setAttribute("download", current.name);

    lightboxModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightboxModal.style.display = "none";
    lightboxImage.src = "";
    document.body.style.overflow = "";
  }

  function nextLightbox() {
    if (!galleryImages.length) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length;
    openLightbox(currentLightboxIndex);
  }

  function prevLightbox() {
    if (!galleryImages.length) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(currentLightboxIndex);
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener("click", closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeLightbox);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener("click", nextLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener("click", prevLightbox);

  window.addEventListener("keydown", (e) => {
    if (errorModal && errorModal.style.display === "flex" && e.key === "Escape") {
      hideErrorPopup();
    }
    if (lightboxModal && lightboxModal.style.display === "flex") {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
    }
  });

  // Attach listeners to any server-rendered gallery items on initial page load
  attachGalleryListeners();
});
