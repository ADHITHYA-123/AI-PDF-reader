const zoomButton = document.getElementById('zoom');
const input = document.getElementById('inputFile');
const openFile = document.getElementById('openPDF');
const currentPage = document.getElementById('current_page');
const viewer = document.querySelector('.pdf-viewer');

// NEW: Add a container for the text layer overlay
const textLayerDiv = document.getElementById('textLayer'); // Ensure you add this element in your HTML

let currentPDF = {}

function resetCurrentPDF() {
	currentPDF = {
		file: null,
		countOfPages: 0,
		currentPage: 1,
		zoom: 1.5
	}
}

openFile.addEventListener('click', () => {
	input.click();
});

input.addEventListener('change', event => {
	const inputFile = event.target.files[0];
	if (inputFile.type == 'application/pdf') {
		const reader = new FileReader();
		reader.readAsDataURL(inputFile);
		reader.onload = () => {
			loadPDF(reader.result);
			zoomButton.disabled = false;
		}
	}
	else {
		alert("The file you are trying to open is not a pdf file!")
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
	const isValidPage = currentPDF.currentPage < currentPDF.countOfPages;
	if (isValidPage) {
		currentPDF.currentPage += 1;
		renderCurrentPage();
	}
});

document.getElementById('previous').addEventListener('click', () => {
	const isValidPage = currentPDF.currentPage - 1 > 0;
	if (isValidPage) {
		currentPDF.currentPage -= 1;
		renderCurrentPage();
	}
});

function loadPDF(data) {
	const pdfFile = pdfjsLib.getDocument(data);
	resetCurrentPDF();
	pdfFile.promise.then((doc) => {
		currentPDF.file = doc;
		currentPDF.countOfPages = doc.numPages;
		viewer.classList.remove('hidden');
		document.querySelector('main h3').classList.add("hidden");
		renderCurrentPage();
	});
}

function renderCurrentPage() {
    currentPDF.file.getPage(currentPDF.currentPage).then((page) => {
        var context = viewer.getContext('2d');
        var viewport = page.getViewport({ scale: currentPDF.zoom });
        viewer.height = viewport.height;
        viewer.width = viewport.width;

        var renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        // Render the PDF page on canvas
        page.render(renderContext).promise.then(() => {
            // ✅ Clear any existing text overlay
            textLayerDiv.innerHTML = '';

            // ✅ Render the text layer so that words and sentences are selectable
            page.getTextContent().then((textContent) => {
                textContent.items.forEach((item) => {
                    const span = document.createElement('span');
                    span.textContent = item.str;

                    // ✅ Use the transformation matrix provided by PDF.js to position the text
                    const transform = item.transform;
                    const x = transform[4];
                    const y = transform[5];
                    span.style.position = 'absolute';
                    span.style.left = `${x * currentPDF.zoom}px`;
                    // ✅ Adjust top position (PDF.js uses a different coordinate system)
                    span.style.top = `${(viewport.height - y * currentPDF.zoom) - 5}px`; // Try adjusting the -5 value
                    // ✅ Set font size (adjust for better alignment if needed)
                    span.style.fontSize = `${item.height * currentPDF.zoom}px`;

                    // ✅ Allow text selection (removed background color)
                    span.style.pointerEvents = 'auto';
                    span.style.userSelect = 'text';

                    textLayerDiv.appendChild(span);
                });
            });
        });
    });

    // ✅ Update page count display
    currentPage.innerHTML = currentPDF.currentPage + ' of ' + currentPDF.countOfPages;
}
