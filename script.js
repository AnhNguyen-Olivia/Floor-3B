const PASS_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // Hash of "1234"
const MAX_ATTEMPTS = 1;
const COOLDOWN_TIME = 15000; // 15 seconds
const JUMPSCARE_DURATION = 5000;

let attemptCount = parseInt(localStorage.getItem('attemptCount')) || 0;
let lastAttemptTime = parseInt(localStorage.getItem('lastAttemptTime')) || 0;
let isLocked = false;
let isCooldownActive = false;
let messageInterval;
let currentMessageIndex = 0;
let isWrong = localStorage.getItem('isWrong') === 'false' || false;
let jumpscareTriggered = false; // New flag to track jumpscare state

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check lockdown status immediately on page load
    checkLockdownStatus();

    // Preload resources
    const screamSound = new Audio("audio/full-golden-freddy-scream.mp3");
    const jumpscareImage = new Image();
    
    // Load audio
    const audioLoadPromise = new Promise((resolve) => {
        screamSound.addEventListener('canplaythrough', () => {
            resolve();
        });
        screamSound.load();
    });

    // Load image
    const imageLoadPromise = new Promise((resolve) => {
        jumpscareImage.onload = () => {
            resolve();
        };
        jumpscareImage.src = "pics/the picture.jpg";
    });

    function checkLockdownStatus() {
        const cooldownTime = isInCooldown();
        if (cooldownTime > 0) {
            isLocked = true;
            isCooldownActive = true;
            document.getElementById('codeForm').classList.add('disabled');
            startCooldown();
        }
    }

    // Password hashing function
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Cooldown check function
    function isInCooldown() {
        if (attemptCount >= MAX_ATTEMPTS) {
            const currentTime = Date.now();
            if (currentTime - lastAttemptTime < COOLDOWN_TIME) {
                return Math.ceil((COOLDOWN_TIME - (currentTime - lastAttemptTime)) / 1000);
            }
            // Reset attempts if cooldown is over
            attemptCount = 0;
            localStorage.setItem('attemptCount', '0');
            localStorage.removeItem('lastAttemptTime');
            isCooldownActive = false;
            return 0;
        }
        return 0;
    }

    // Update countdown display
    function updateCountdown(seconds) {
        const countdownContainer = document.querySelector('.countdown-container');
        const countdownTimer = document.querySelector('.countdown-timer');
        
        if (seconds > 0) {
            countdownContainer.style.display = 'flex';
            countdownTimer.textContent = `${seconds}`;
        } else {
            countdownContainer.style.display = 'none';
        }
    }

    // Start cooldown timer
    function startCooldown() {
        lastAttemptTime = Date.now();
        localStorage.setItem('lastAttemptTime', lastAttemptTime.toString());
        isCooldownActive = true;
        
        function updateCooldownMessage() {
            const remainingTime = isInCooldown();
            const feedback = document.getElementById('feedback');
            if (remainingTime > 0) {
                updateCountdown(remainingTime);
                feedback.textContent = `Too many attempts. Please wait ${remainingTime} seconds.`;
                setTimeout(updateCooldownMessage, 1000);
            } else {
                updateCountdown(0);
                feedback.textContent = "";
                isLocked = false;
                document.getElementById('codeForm').classList.remove('disabled');
            }
        }
        
        updateCooldownMessage();
    }

    // Creepy messages handling
    const creepyMessages = [
        "Analyzing your code...",
        "Processing attempt...",
        "Verifying identity...",
        "You shouldn't be here...",
        "Warning: Unknown presence detected...",
        "System compromise detected...",
        "Emergency protocols initiated...",
        "Connection terminated..."
    ];

    function updateLoadingMessage() {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = creepyMessages[currentMessageIndex];
            currentMessageIndex = (currentMessageIndex + 1) % creepyMessages.length;
        }
    }

    function startCreepyMessages() {
        currentMessageIndex = 0;
        updateLoadingMessage();
        messageInterval = setInterval(updateLoadingMessage, 1000);
    }

    function stopCreepyMessages() {
        clearInterval(messageInterval);
        currentMessageIndex = 0;
    }

    // Jumpscare sequence
    function triggerJumpscareSequence() {
        const jumpscare = document.getElementById('jumpscare');
        const form = document.getElementById('codeForm');
        
        screamSound.currentTime = 0;
        screamSound.play().catch(error => {
            console.error("Audio playback failed:", error);
        });
        
        setTimeout(() => {
            jumpscare.src = jumpscareImage.src;
            jumpscare.style.display = 'block';
            document.body.classList.add('shake');
        }, 500);
        
        setTimeout(() => {
            jumpscare.style.display = 'none';
            document.body.classList.remove('shake');
            
            if (attemptCount < MAX_ATTEMPTS) {
                isLocked = false;
                form.classList.remove('disabled');
                document.getElementById('feedback').textContent = '';
            }
            
            document.getElementById('password').value = '';
            stopCreepyMessages();
        }, JUMPSCARE_DURATION);
    }

    function startGlitchEffect() {
        const body = document.body;
        body.classList.add('glitch');
        setTimeout(() => body.classList.remove('glitch'), 800);
    }

    // Main form submission handler
    document.getElementById('codeForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (isLocked) return;
        
        const cooldownTime = isInCooldown();
        if (cooldownTime > 0) {
            document.getElementById('feedback').textContent = 
                `Too many attempts. Please wait ${cooldownTime} seconds.`;
            return;
        }
        
        const enteredPassword = document.getElementById('password').value;
        const feedback = document.getElementById('feedback');
        const form = document.getElementById('codeForm');
        
        const hashedInput = await hashPassword(enteredPassword);
        
        if (hashedInput !== PASS_HASH) {
            isWrong = true;
            localStorage.setItem('isWrong', 'true');
            
            attemptCount++;
            localStorage.setItem('attemptCount', attemptCount.toString());
            isLocked = true;
            form.classList.add('disabled');
            
            feedback.textContent = attemptCount >= MAX_ATTEMPTS 
                ? 'Wrong password. Please wait...'
                : `Wrong password. ${MAX_ATTEMPTS - attemptCount} attempts remaining.`;
            
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.style.display = 'flex';
            startCreepyMessages();
            
            setTimeout(() => {
                loadingScreen.style.display = 'flex';
                stopCreepyMessages();
                isLocked = false;
                form.classList.remove('disabled');
            }, 5000);
        } else {
            feedback.textContent = "Access granted!";
            localStorage.setItem('isWrong', 'false');
            jumpscareTriggered = false;
            setTimeout(() => {
                window.open("https://www.youtube.com/watch?v=D-UmfqFjpl0", "_blank");
            }, 1000);
        }
    });

    // Add this new event listener
    document.getElementById('password').addEventListener('focus', function() {
        // Only trigger jumpscare if:
        // 1. The last attempt was wrong 
        // 2. Jumpscare hasn't been triggered yet
        if (localStorage.getItem('isWrong') === 'true' && !jumpscareTriggered) {
            // Wait 2 seconds, during which the user can still type normally
            setTimeout(() => {
                Promise.all([audioLoadPromise, imageLoadPromise])
                    .then(() => {
                        startGlitchEffect();
                        triggerJumpscareSequence();
                        
                        // Mark jumpscare as triggered
                        jumpscareTriggered = true;
                        
                        // Optional: Reset isWrong after jumpscare
                        localStorage.setItem('isWrong', 'false');
                    })
                    .catch(error => console.error("Resource loading failed:", error));
            }, 2000);
        }
    });
});