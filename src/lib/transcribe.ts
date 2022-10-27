import { env } from '$env/dynamic/private';
import axios from 'axios';
import { createAuthFetch } from './panopto-oauth';
import FormData from 'form-data';

export interface TranscribeUpdate {
	type: 'progress' | 'error' | 'complete';
	message: string;
	progress?: number;
	time: number; // Seconds since start
}

export default class Transcriber {
	public cancelled = false;
	public async cancel() {
		this.cancelled = true;
	}

	public readonly startTime = Date.now();
	public secondsSinceStart() {
		return (Date.now() - this.startTime) / 1000;
	}

	constructor(public readonly sessionID: string, public readonly accessToken: string) {}

	public async *transcribe(): AsyncGenerator<TranscribeUpdate> {
		const authFetch = createAuthFetch(this.accessToken);

		const { data } = await authFetch(`api/v1/sessions/${this.sessionID}`);
		const downloadUrl = data?.Urls?.DownloadUrl;
		if (!downloadUrl) {
			throw new Error('No download URL found');
		}

		// The following did not work - something about the audio podcast file format needs playing with. For now, we'll use the video podcast, which transfers more data but works.
		// // Swap to get audio podcast (less data)
		const audioDownloadUrl = new URL(downloadUrl);
		// audioDownloadUrl.searchParams.set('mediaTargetType', 'audioPodcast');

		// Get Legacy Cookies
		let legacyCookies: string[] = [];
		try {
			const legacyCookiesRes = await authFetch('api/v1/auth/legacyLogin');
			if (!legacyCookiesRes.headers['set-cookie']) {
				throw new Error('No legacy cookies found');
			}
			legacyCookies = legacyCookiesRes.headers['set-cookie'];
		} catch (error) {
			throw new Error('Failed to get legacy cookies');
		}
		const [aspxAuthCookie, csrfCookie] = legacyCookies;

		// Fetch audio file
		let audioFile;
		try {
			yield {
				type: 'progress',
				message: `Fetching audio file from ${audioDownloadUrl}...`,
				time: this.secondsSinceStart()
			};
			const audioRes = await axios.get(audioDownloadUrl.toString(), {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
					cookie: `${aspxAuthCookie} ${csrfCookie}`
				},
				responseType: 'stream'
			});
			audioFile = audioRes.data;
		} catch (error) {
			console.error(error);
			throw new Error('Failed to fetch the lecture downlad file from Panopto');
		}
		// Get transcription from backend server
		let srtFile;
		try {
			yield {
				type: 'progress',
				message: 'Transcribing audio file... This will take a while.',
				time: this.secondsSinceStart()
			};
			console.log(`Transcribing audio file: ${this.sessionID}`);
			const form = new FormData();
			form.append('audio_file', audioFile);
			const srt = await axios.post(`${env.BACKEND_WHISPER_HOST}/get-srt`, form, {
				headers: form.getHeaders(),
				responseType: 'stream'
			});
			console.log(
				`Finished transcribing audio file (took ${this.secondsSinceStart().toFixed(2)} seconds)...`
			);
			srtFile = srt.data;
		} catch (error) {
			console.error(error);
			throw new Error('Failed to transcribe the lecture');
		}
		// Save SRT file to Panopto
		try {
			yield {
				type: 'progress',
				message: 'Saving transcription to Panopto...',
				time: this.secondsSinceStart()
			};
			yield {
				type: 'progress',
				message: 'Deleting existing captions (required by Panopto',
				time: this.secondsSinceStart()
			};
			await authFetch.delete(`api/v1/sessions/${this.sessionID}/captions/languages/English_GBR`);
			yield { type: 'progress', message: 'Uploading new captions', time: this.secondsSinceStart() };
			const srtForm = new FormData();
			srtForm.append('file', srtFile);
			srtForm.append('language', 'English_GBR');
			const srtRes = await authFetch.post(`api/v1/sessions/${this.sessionID}/captions`, srtForm, {
				headers: srtForm.getHeaders()
			});

			if (srtRes.status !== 200) {
				throw new Error('Failed to upload transcription to Panopto');
			}
			yield {
				type: 'complete',
				message: 'Transcription completed and uploaded!',
				time: this.secondsSinceStart()
			};
			return;
		} catch (error: any) {
			console.error(error);
			console.error(error.response.data);
			throw new error('Failed to save the transcript to Panopto');
		}
	}
}
