const zoomButton = document.getElementById('zoom');
const input = document.getElementById('inputFile');
const openFile = document.getElementById('openPDF');
const currentPage = document.getElementById('current_page');
const viewer = document.querySelector('.pdf-viewer');
const textLayerDiv = document.getElementById('textLayer');

let currentPDF = {};
let fullText = ""; // Store the full text of the PDF

function resetCurrentPDF() {
    currentPDF = {
        file: null,
        countOfPages: 0,
        currentPage: 1,
        zoom: 1.5
    };
}

openFile.addEventListener('click', () => input.click());

input.addEventListener('change', event => {
    const inputFile = event.target.files[0];
    if (inputFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.readAsDataURL(inputFile);
        reader.onload = () => {
            loadPDF(reader.result);
            zoomButton.disabled = false;
        };
    } else {
        alert("The file you are trying to open is not a PDF file!");
    }
});

zoomButton.addEventListener('input', () => {
    if (currentPDF.file) {
        document.getElementById('zoomValue').innerHTML = zoomButton.value + "%";
        currentPDF.zoom = parseInt(zoomButton.value) / 100;
        renderCurrentPage();
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (currentPDF.currentPage < currentPDF.countOfPages) {
        currentPDF.currentPage += 1;
        renderCurrentPage();
    }
});

document.getElementById('previous').addEventListener('click', () => {
    if (currentPDF.currentPage > 1) {
        currentPDF.currentPage -= 1;
        renderCurrentPage();
    }
});

async function loadPDF(data) {
    const pdfFile = pdfjsLib.getDocument(data);
    resetCurrentPDF();
    fullText = "";

    try {
        const doc = await pdfFile.promise;
        currentPDF.file = doc;
        currentPDF.countOfPages = doc.numPages;
        viewer.classList.remove('hidden');
        document.querySelector('main h3').classList.add("hidden");

        // Extract text from all pages in the background
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }

        renderCurrentPage();
    } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Failed to load PDF");
    }
}

function renderCurrentPage() {
    currentPDF.file.getPage(currentPDF.currentPage).then(page => {
        const context = viewer.getContext('2d');
        const viewport = page.getViewport({ scale: currentPDF.zoom });

        viewer.height = viewport.height;
        viewer.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        // Clear existing canvas and text layer
        context.clearRect(0, 0, viewer.width, viewer.height);
        textLayerDiv.innerHTML = '';

        // Render PDF page on canvas
        page.render(renderContext).promise.then(() => {
            page.getTextContent().then(textContent => {
                textContent.items.forEach(item => {
                    const span = document.createElement('span');
                    span.textContent = item.str;

                    // Use transformation matrix to position text correctly
                    const [a, b, c, d, x, y] = item.transform;
                    span.style.position = 'absolute';
                    span.style.left = `${x * currentPDF.zoom}px`;
                    span.style.top = `${(viewport.height - y * currentPDF.zoom) - 5}px`;
                    span.style.fontSize = `${item.height * currentPDF.zoom}px`;

                    // Allow text selection
                    span.style.pointerEvents = 'auto';
                    span.style.userSelect = 'text';

                    textLayerDiv.appendChild(span);
                });
            });
        });
    });

    // Update page count display
    currentPage.innerHTML = `${currentPDF.currentPage} of ${currentPDF.countOfPages}`;
}

// Popup handling for AI interaction
let selectedText = "";
let textToAi = "";

// Capture selected text from the text layer
textLayerDiv.addEventListener("mouseup", () => {
    const selection = window.getSelection().toString().trim();

    if (selection) {
        const words = selection.split(' ');

        selectedText = words.length > 20
            ? `${words.slice(0, 10).join(' ')} ... ${words.slice(-10).join(' ')}`
            : selection;

        textToAi = selection;
        document.getElementById("selected-text").innerText = selectedText;
        openPopup();
    }
});

// Open popup
function openPopup() {
    document.getElementById("popup").classList.remove("hidden");
}

// Close popup and reset fields
function closePopup() {
    document.getElementById("popup").classList.add("hidden");
    resetPopup();
}

// Reset popup data
function resetPopup() {
    document.getElementById("ai-prompt").value = "";
    document.getElementById("ai-response").innerText = "";
    document.getElementById("selected-text").innerText = "";
    selectedText = "";
}

// Send data to AI backend
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

    // Show loading state
    document.getElementById('ai-response').innerText = "Loading response...";

    try {
        const response = await fetch('http://localhost:5000/api/ask-ai', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: prompt,
              selectedText: textToAi,
              context: fullText
            })
          });
          

        if (!response.ok) {
            // ✅ Fix: Better error handling for different status codes
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed with status ${response.status}`);
        }

        const data = await response.json();
        document.getElementById('ai-response').innerText = data.response;
    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('ai-response').innerText = `Failed to fetch AI response: ${error.message}`;
    }
}

