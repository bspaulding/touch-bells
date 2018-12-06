import E from './samples/E.wav';
import Fsharp from './samples/Fsharp.wav';
import G from './samples/G.wav';
import B from './samples/B.wav';

const notes = { E, "Fsharp": Fsharp, G, B };
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const importAudio = url =>
	new Promise((resolve, reject) => {
		let req = new XMLHttpRequest();
		req.open('GET', encodeURI(url), true);
		req.responseType = 'arraybuffer';
		req.onload = () => {
			audioContext.decodeAudioData(req.response, resolve, reject);
		};
		req.onerror = reject;
		req.send();
	});
let loadingP = [];

function buildReverbImpulse(context) {
	const rate = context.sampleRate;
	const length = rate * 2;
	const decay = 3.4;
	const impulse = context.createBuffer(2, length, rate)
	const impulseL = impulse.getChannelData(0)
	const impulseR = impulse.getChannelData(1)

	for (let i = 0; i < length; i += 1) {
		impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
		impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
	}

	return impulse;
}
const reverb = audioContext.createConvolver();
reverb.buffer = buildReverbImpulse(audioContext);
const reverbGain = audioContext.createGain();
reverb.connect(reverbGain);
reverbGain.connect(audioContext.destination);
reverbGain.gain.value = 0.7;

const touchSupported = 'ontouchstart' in window;
document.querySelectorAll('.bell').forEach(button => {
	const note = button.getAttribute('data-note');
	let sampleData = null;
	loadingP.push(
		importAudio(notes[note]).then(buffer => {
			sampleData = buffer;
			button.addEventListener(
				touchSupported ? 'touchstart' : 'mousedown',
				() => {
					const source = audioContext.createBufferSource();
					source.buffer = sampleData;
					source.connect(audioContext.destination);
					source.connect(reverb);

					button.classList.add('ring');
					source.start(0);
					setTimeout(() => {
						button.classList.remove('ring');
					}, 1000);
				},
				{ passive: true }
			);
		})
	);
});
const removeLoader = () => {
	const loader = document.querySelector('#loading');
	if (loader) {
		document.body.removeChild(loader);
	}
	const bells = document.querySelector('.bells');
	if (bells) {
		bells.style.display = 'flex';
	}
};
Promise.all(loadingP)
	.then(removeLoader)
	.catch(error => {
		alert(error);
		removeLoader()
	});
