let audioCtx;

export const playPing = (type) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const t = audioCtx.currentTime;

  if (type === 'flip') {
    // Quick pop/swish
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, t);
    oscillator.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    oscillator.start(t);
    oscillator.stop(t + 0.1);
  } else if (type === 'yes') {
    // Upward ding
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, t);
    oscillator.frequency.setValueAtTime(554, t + 0.1);
    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    oscillator.start(t);
    oscillator.stop(t + 0.3);
  } else if (type === 'no') {
    // Low downward blip
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, t);
    oscillator.frequency.setValueAtTime(150, t + 0.1);
    gainNode.gain.setValueAtTime(0.1, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    oscillator.start(t);
    oscillator.stop(t + 0.2);
  } else if (type === 'confidence') {
    // High crisp ding
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, t);
    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    oscillator.start(t);
    oscillator.stop(t + 0.2);
  } else if (type === 'hint') {
    // Gentle "idea" double chime
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, t);
    oscillator.frequency.setValueAtTime(800, t + 0.15);
    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    oscillator.start(t);
    oscillator.stop(t + 0.4);
  } else if (type === 'hooray') {
    // Happy arpeggio
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, t);       // A4
    oscillator.frequency.setValueAtTime(554.37, t + 0.1); // C#5
    oscillator.frequency.setValueAtTime(659.25, t + 0.2); // E5
    oscillator.frequency.setValueAtTime(880, t + 0.3);    // A5
    
    gainNode.gain.setValueAtTime(0.3, t);
    gainNode.gain.setValueAtTime(0.3, t + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    
    oscillator.start(t);
    oscillator.stop(t + 0.6);
  }
};
