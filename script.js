const video = document.getElementById('videoElement');
const descriptionDiv = document.getElementById('description');
let descriptions = [];
let previous;

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        describeFrame();
    })
    .catch(err => {
        console.error("Error accessing the media:", err);
        descriptionDiv.textContent = 'Please enable camera access to use this feature.';
    });

function captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

function processDescriptions(description) {
    descriptions.push(description);
    if (descriptions.length === 1) {
        const paragraph = descriptions.join(" ");
        sendForSummarization(paragraph);
        descriptions = [];
    }
}

function describeFrame() {
    const imageData = captureFrame();
    const requestData = {
        model: "llava",
        prompt: "Describe the scene captured by the webcam in one line.",
        stream: false,
        images: [imageData.split(',')[1]]
    };

    fetch('https://aiapi.saipriya.org/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        processDescriptions(data.response);
    })
    .catch(error => {
        console.error('Error calling the API:', error);
    })
    .finally(() => {
        setTimeout(describeFrame); // Adjust the timing as needed
    });
}

function sendForSummarization(paragraph) {
    const requestData = {
        model: "llama3:8b",
        prompt: "Summarize the following 8 descriptions: " + paragraph,
        stream: false
    };

    fetch('https://aiapi.saipriya.org/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        previous = data.response;
        descriptionDiv.textContent = "Summary: " + (data.response || 'No summary available');
    })
    .catch(error => {
        console.error('Error summarizing the text:', error);
    });
}
