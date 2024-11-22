const PASS_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // Hash of "1234"
const MAX_ATTEMPTS = 1;
const COOLDOWN_TIME = 15000; // 15 seconds
const JUMPSCARE_DURATION = 5000;

let attemptCount = 0;
let lastAttemptTime = 0;
let isLocked = false;
let isCooldownActive = false;
let messageInterval;
let currentMessageIndex = 0;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Preload resources
    const screamSound = new Audio("audio/full-golden-freddy-scream.mp3");
    let isAudioLoaded = false;
    let isImageLoaded = false;

    // Audio loading promise
    const audioLoadPromise = new Promise((resolve) => {
        screamSound.addEventListener('canplaythrough', () => {
            isAudioLoaded = true;
            resolve();
        });
        screamSound.load();
    });

    // Image loading after audio
    const jumpscareImage = new Image();
    const imageLoadPromise = audioLoadPromise.then(() => {
        return new Promise((resolve) => {
            jumpscareImage.onload = () => {
                isImageLoaded = true;
                resolve();
            };
            jumpscareImage.src = "pics/the picture.jpg";
        });
    });

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
        if (isCooldownActive && attemptCount >= MAX_ATTEMPTS) {
            const currentTime = Date.now();
            if (currentTime - lastAttemptTime < COOLDOWN_TIME) {
                return Math.ceil((COOLDOWN_TIME - (currentTime - lastAttemptTime)) / 1000);
            }
            attemptCount = 0;
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
            countdownTimer.textContent = seconds;
        } else {
            countdownContainer.style.display = 'none';
        }
    }

    function createBloodDrips() {
        const bloodDrips = document.querySelector('.blood-drips');
        const numberOfDrips = 20;

        for (let i = 0; i < numberOfDrips; i++) {
            const drip = document.createElement('div');
            drip.className = 'blood-drip';
            drip.style.left = `${Math.random() * 100}%`;
            drip.style.animationDelay = `${Math.random() * 4}s`;
            drip.style.animationDuration = `${3 + Math.random() * 2}s`;
            bloodDrips.appendChild(drip);
        }
    }
    createBloodDrips();

    setInterval(createBloodDrips, 6000);
    
    // Start cooldown timer
    function startCooldown() {
        lastAttemptTime = Date.now();
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
        if (loadingText && loadingText.offsetParent !== null) {
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
        
        if (!isAudioLoaded || !isImageLoaded) {
            console.error("Resources not fully loaded");
            return;
        }
        
        screamSound.currentTime = 0;
        screamSound.play().then(() => {
            setTimeout(() => {
                jumpscare.src = jumpscareImage.src;
                jumpscare.style.display = 'flex';
                document.body.classList.add('shake');
            }, 500);
        }).catch(error => {
            console.error("Audio playback failed:", error);
        });
        
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
            attemptCount++;
            isLocked = true;
            form.classList.add('disabled');
            
            feedback.textContent = attemptCount >= MAX_ATTEMPTS 
                ? `Wrong password. Please wait...`
                : `Wrong password. ${MAX_ATTEMPTS - attemptCount} attempts remaining.`;
            
            const loadingScreen = document.getElementById('loadingScreen');
            loadingScreen.style.display = 'flex';
            startCreepyMessages();
            
            Promise.all([audioLoadPromise, imageLoadPromise])
                .then(() => {
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        startGlitchEffect();
                        setTimeout(() => {
                            triggerJumpscareSequence();
                            if (attemptCount >= MAX_ATTEMPTS) {
                                setTimeout(startCooldown, JUMPSCARE_DURATION);
                            }
                        }, 1500);
                    }, 5000);
                })
                .catch(error => console.error("Resource loading failed:", error));
        } else {
            const redirectURL = "https://www.youtube.com/watch?v=D-UmfqFjpl0";
            feedback.textContent = "Access granted!";
            if (typeof redirectURL !== 'undefined') {
                window.open(redirectURL, "_blank");
            }
        }
    });
});