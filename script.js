class PomodoroTimer {
    constructor() {
        this.workTime = 25 * 60; // 25 minutes in seconds
        this.breakTime = 5 * 60; // 5 minutes in seconds
        this.longBreakTime = 15 * 60; // 15 minutes in seconds
        this.currentTime = this.workTime;
        this.isRunning = false;
        this.isWorkTime = true;
        this.sessionCount = 0;
        this.interval = null;
        this.audio = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.timeElement = document.getElementById('time');
        this.statusElement = document.getElementById('status');
        this.startButton = document.getElementById('start');
        this.pauseButton = document.getElementById('pause');
        this.resetButton = document.getElementById('reset');
        this.workModeButton = document.getElementById('workMode');
        this.restModeButton = document.getElementById('restMode');
        this.workTimeInput = document.getElementById('workTime');
        this.breakTimeInput = document.getElementById('breakTime');
        this.longBreakTimeInput = document.getElementById('longBreakTime');
        this.progressFill = document.getElementById('progressFill');
        this.sessionCountElement = document.getElementById('sessionCount');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.closeNotification = document.getElementById('closeNotification');
        this.focusModal = document.getElementById('focusModal');
        this.focusInput = document.getElementById('focusInput');
        this.setFocusBtn = document.getElementById('setFocusBtn');
        this.focusDisplay = document.getElementById('focusDisplay');
        this.modeAnimation = document.getElementById('modeAnimation');
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.handleStartWithFocus());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());
        this.workModeButton.addEventListener('click', () => this.setWorkMode());
        this.restModeButton.addEventListener('click', () => this.setRestMode());
        this.closeNotification.addEventListener('click', () => this.hideNotification());
        this.setFocusBtn.addEventListener('click', () => this.setFocus());
        this.focusInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.setFocus();
        });
        
        // Settings inputs
        this.workTimeInput.addEventListener('change', () => {
            this.workTime = parseInt(this.workTimeInput.value) * 60;
            if (!this.isRunning && this.isWorkTime) {
                this.currentTime = this.workTime;
                this.updateDisplay();
            }
        });
        
        this.breakTimeInput.addEventListener('change', () => {
            this.breakTime = parseInt(this.breakTimeInput.value) * 60;
            if (!this.isRunning && !this.isWorkTime) {
                this.currentTime = this.breakTime;
                this.updateDisplay();
            }
        });
        
        this.longBreakTimeInput.addEventListener('change', () => {
            this.longBreakTime = parseInt(this.longBreakTimeInput.value) * 60;
        });
        
        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    handleStartWithFocus() {
        if (!this.isRunning && !this.focusDisplay.textContent) {
            this.showFocusModal();
        } else {
            this.start();
        }
    }

    showFocusModal() {
        this.focusModal.style.display = 'flex';
        this.focusInput.value = '';
        setTimeout(() => this.focusInput.focus(), 100);
    }

    setFocus() {
        const value = this.focusInput.value.trim();
        if (value) {
            this.focusDisplay.textContent = `Focusing on: ${value}`;
            this.focusDisplay.style.display = 'block';
            this.focusModal.style.display = 'none';
            this.start();
        }
    }

    setWorkMode() {
        if (this.isRunning) return; // Don't allow mode change while timer is running
        
        this.isWorkTime = true;
        this.currentTime = this.workTime;
        this.updateDisplay();
        this.updateStatus('Work Time');
        this.updateProgress();
        this.showModeAnimation('work');
        
        // Update button states
        this.workModeButton.classList.add('active');
        this.restModeButton.classList.remove('active');
    }

    setRestMode() {
        if (this.isRunning) return; // Don't allow mode change while timer is running
        
        this.isWorkTime = false;
        this.currentTime = this.breakTime;
        this.updateDisplay();
        this.updateStatus('Break Time');
        this.updateProgress();
        this.showModeAnimation('rest');
        
        // Update button states
        this.restModeButton.classList.add('active');
        this.workModeButton.classList.remove('active');
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startButton.disabled = true;
            this.pauseButton.disabled = false;
            
            this.interval = setInterval(() => {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.completeSession();
                }
            }, 1000);
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            clearInterval(this.interval);
        }
    }
    
    reset() {
        this.pause();
        this.isWorkTime = true;
        this.currentTime = this.workTime;
        this.sessionCount = 0;
        this.updateDisplay();
        this.updateStatus();
        this.updateProgress();
        this.sessionCountElement.textContent = this.sessionCount;
        this.showModeAnimation('work'); // Default to work mode animation
        
        // Reset mode buttons to work mode
        this.workModeButton.classList.add('active');
        this.restModeButton.classList.remove('active');
        // Hide focus display
        this.focusDisplay.textContent = '';
        this.focusDisplay.style.display = 'none';
    }
    
    completeSession() {
        this.pause();
        this.playNotificationSound();
        this.showNotification();
        
        if (this.isWorkTime) {
            this.sessionCount++;
            this.sessionCountElement.textContent = this.sessionCount;
            
            // Check if it's time for a long break (every 4 sessions)
            if (this.sessionCount % 4 === 0) {
                this.currentTime = this.longBreakTime;
                this.isWorkTime = false;
                this.updateStatus('Long Break Time');
            } else {
                this.currentTime = this.breakTime;
                this.isWorkTime = false;
                this.updateStatus('Break Time');
            }
        } else {
            this.currentTime = this.workTime;
            this.isWorkTime = true;
            this.updateStatus('Work Time');
        }
        
        this.updateDisplay();
        this.updateProgress();
        
        // Add completion animation
        this.timeElement.classList.add('complete');
        setTimeout(() => {
            this.timeElement.classList.remove('complete');
        }, 500);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.updateProgress();
    }
    
    updateStatus(status = null) {
        if (status) {
            this.statusElement.textContent = status;
        } else {
            this.statusElement.textContent = this.isWorkTime ? 'Work Time' : 'Break Time';
        }
    }
    
    updateProgress() {
        const totalTime = this.isWorkTime ? this.workTime : (this.sessionCount % 4 === 0 ? this.longBreakTime : this.breakTime);
        const elapsed = totalTime - this.currentTime;
        const percentage = (elapsed / totalTime) * 100;
        this.progressFill.style.width = `${percentage}%`;
    }
    
    showNotification() {
        const message = this.isWorkTime ? 
            `Break time! Take a ${this.breakTime / 60} minute break.` : 
            `Work time! Focus for ${this.workTime / 60} minutes.`;
        
        this.notificationText.textContent = message;
        this.notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50">🍅</text></svg>'
            });
        }
    }
    
    hideNotification() {
        this.notification.classList.remove('show');
    }
    
    playNotificationSound() {
        // Create a simple notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    showModeAnimation(mode) {
        if (mode === 'work') {
            this.modeAnimation.innerHTML = `
                <span class="book-emoji" style="animation-delay:0s;">📚</span>
                <span class="book-emoji" style="animation-delay:0.1s;">📖</span>
                <span class="book-emoji" style="animation-delay:0.2s;">📚</span>
            `;
        } else if (mode === 'rest') {
            this.modeAnimation.innerHTML = `
                <span class="rest-emoji" style="animation-delay:0s;">☕</span>
                <span class="rest-emoji" style="animation-delay:0.1s;">🛌</span>
            `;
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
}); 