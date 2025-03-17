const pdfViewer = document.getElementById("pdf-viewer");
let fullText = "";

// ✅ Load PDF file
document.getElementById("pdf-upload").addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file || file.type !== "application/pdf") {
    alert("Please upload a valid PDF file");
    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: e.target.result });
      const pdf = await loadingTask.promise;

      pdfViewer.innerHTML = "";
      fullText = "";

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();

        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";

        // ✅ Display PDF content
        const pageElement = document.createElement("div");
        pageElement.innerText = pageText;
        pageElement.className = "mb-4";
        pdfViewer.appendChild(pageElement);
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF");
    }
  };

  reader.readAsArrayBuffer(file);
});

// ✅ Capture selected text
let selectedText = "";

pdfViewer.addEventListener("mouseup", () => {
  const selection = window.getSelection().toString().trim();

  if (selection) {
    selectedText = selection;
    document.getElementById("selected-text").innerText = selectedText;
    openPopup();
  }
});

// ✅ Open popup
function openPopup() {
  document.getElementById("popup").classList.remove("hidden");
}

// ✅ Close popup and reset fields
function closePopup() {
  document.getElementById("popup").classList.add("hidden");
  resetPopup(); // ✅ Reset data after closing popup
}

// ✅ Reset popup data
function resetPopup() {
  document.getElementById("ai-prompt").value = ""; // Clear prompt input
  document.getElementById("ai-response").innerText = ""; // Clear AI response
  document.getElementById("selected-text").innerText = ""; // Clear selected text
  selectedText = ""; // Reset selectedText variable
}

// ✅ Send data to AI backend
async function handleAIRequest() {
  const prompt = document.getElementById("ai-prompt").value;

  if (!prompt) {
    alert("Please enter a prompt");
    return;
  }

  if (!selectedText) {
    alert("Please select some text");
    return;
  }

  if (!fullText) {
    alert("PDF content is missing");
    return;
  }

  try {
    console.log('Sending data to AI...');

    const res = await fetch('http://localhost:5000/api/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        selectedText,
        context: fullText
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log('AI Response:', data.response);

    // ✅ Display response in frontend
    document.getElementById('ai-response').innerText = data.response;
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to fetch AI response');
  }
}
