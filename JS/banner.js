document.addEventListener('DOMContentLoaded', () => {
    const questionBanner = document.getElementById('questionBanner');
    const questionTextContainer = document.getElementById('questionText');
    const answerOptionsContainer = document.getElementById('answerOptions');
    const closeBannerButton = document.getElementById('closeBannerButton'); // Get the new close button

    const baseUrl = 'https://script.google.com/macros/s/AKfycbzcJyaX-3lzwQaKKv7HbqaC5aindX8V5WBIDceR6zpJjo8O81Ps-m5sXmeQJubHIZZX/exec';
    const questionApiUrl = `${baseUrl}?action=getQuestion`;
    const responseApiUrl = baseUrl; // The action and parameters are added dynamically for sending responses

    function fetchQuestion() {
        fetch(questionApiUrl)
            .then(response => response.json())
            .then(data => {
                console.log('Raw data from question API:', data); // Log raw data
                if (data && data.question && data.options && data.options.length > 0) {
                    console.log('Question received:', data.question); // Log question
                    console.log('Options received:', data.options); // Log options
                    displayQuestion(data.question, data.options);
                } else {
                    console.log('No question available or data is malformed. Banner will not be shown.', data);
                    questionBanner.style.display = 'none';
                }
            })
            .catch(err => {
                console.error('Error fetching question:', err);
                questionBanner.style.display = 'none';
            });
    }

    function displayQuestion(question, options) {
        questionTextContainer.textContent = question;
        answerOptionsContainer.innerHTML = ''; // Clear previous options

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => {
                questionBanner.style.display = 'none'; // Hide banner immediately
                sendResponse(option);
            });
            answerOptionsContainer.appendChild(button);
        });

        questionBanner.style.display = 'flex'; // Show the banner
    }

    function sendResponse(answer) {
        console.log('Sending response:', answer);
        // questionBanner.style.display = 'none'; // Moved to the click event listener for immediate hide
        const encodedAnswer = encodeURIComponent(answer);
        // Construct the URL with query parameters as per the updated TODO file
        const urlWithParams = `${responseApiUrl}?action=submitResponse&response=${encodedAnswer}`;

        fetch(urlWithParams) // GET request by default
            .then(res => res.json())
            .then(data => {
                console.log('Response status:', data.status);
                if (data.status === 'success') {
                    console.log('Response saved at:', data.savedAt);
                    questionBanner.style.display = 'none'; // Hide banner after successful response
                    // Optionally, show a success message or thank you note.
                } else {
                    console.error('Error from server:', data.message);
                    // Optionally, inform the user that the answer could not be saved.
                }
            })
            .catch(err => {
                console.error('Fetch error sending response:', err); // Changed console error message for clarity
                // Optionally, inform the user about the network error.
                // Banner is already hidden, so no need to hide it here again on error.
            });
    }

    // Close banner when clicking the close button
    if (closeBannerButton) {
        closeBannerButton.addEventListener('click', () => {
            questionBanner.style.display = 'none';
        });
    }

    // Close banner when clicking outside of it
    document.addEventListener('click', (event) => {
        // Check if the banner is visible and the click is outside the banner and not on an answer button
        if (questionBanner.style.display === 'flex' && !questionBanner.contains(event.target)) {
            // Check if the click was on an answer button (already handled)
            let targetIsAnswerButton = false;
            answerOptionsContainer.querySelectorAll('button').forEach(btn => {
                if (btn === event.target) {
                    targetIsAnswerButton = true;
                }
            });
            if (!targetIsAnswerButton) {
                 questionBanner.style.display = 'none';
            }
        }
    });

    // Fetch the question when the page loads
    fetchQuestion();
});
