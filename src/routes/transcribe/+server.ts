import { client, scope, createAuthFetch } from '$lib/panopto-oauth';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const { sessionID } = await request.json().catch(() => ({ sessionID: '' }));
	if (!sessionID) return new Response('No session ID provided', { status: 400 });

	const token = cookies.get('panopto_access_token');
	const expires = cookies.get('panopto_access_token_expires');
	const accessToken = token && expires && new Date(expires) > new Date() ? token : null;
	if (!accessToken) return new Response('No access token provided', { status: 400 });

	const authFetch = createAuthFetch(accessToken);

	const { data } = await authFetch(`api/v1/sessions/${sessionID}`);
	const downloadUrl = data?.Urls?.DownloadUrl;
	if (!downloadUrl) return new Response('No download URL provided', { status: 500 });

	// The following did not work - something about the audio podcast file format needs playing with. For now, we'll use the video podcast, which transfers more data but works.
	// // Swap to get audio podcast (less data)
	const audioDownloadUrl = new URL(downloadUrl);
	// audioDownloadUrl.searchParams.set('mediaTargetType', 'audioPodcast');

	// Get Legacy Cookies
	let legacyCookies: string[] = [];
	try {
		const legacyCookiesRes = await authFetch('api/v1/auth/legacyLogin');
		if (!legacyCookiesRes.headers['set-cookie'])
			return new Response('No legacy cookies provided', { status: 500 });
		legacyCookies = legacyCookiesRes.headers['set-cookie'];
	} catch (error) {
		console.error(error);
		return new Response('Failed to fetch some of the data from Panopto', { status: 500 });
	}
	const [aspxAuthCookie, csrfCookie] = legacyCookies;

	// Fetch audio file
	let audioFile;
	try {
		console.log(`Fetching audio file from ${audioDownloadUrl}`);
		const audioRes = await axios.get(audioDownloadUrl.toString(), {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				cookie: `${aspxAuthCookie} ${csrfCookie}`
			},
			responseType: 'stream'
		});
		audioFile = audioRes.data;
	} catch (error) {
		console.error(error);
		return new Response('Failed to fetch the lecture downlad file from Panopto', { status: 500 });
	}
	// Get transcription from backend server
	let srtFile;
	try {
		console.log('Sending audio file to backend server for captioning');
		const form = new FormData();
		form.append('audio_file', audioFile);
		const srt = await axios.post(`${env.BACKEND_WHISPER_HOST}/get-srt`, form, {
			headers: form.getHeaders(),
			responseType: 'stream'
		});
		srtFile = srt.data;
	} catch (error) {
		console.error(error);
		return new Response('Failed to transcribe this lecture.', { status: 500 });
	}
	// Save SRT file to Panopto
	try {
		console.log('Deleting existing captions (required by Panopto)');
		await authFetch.delete(`api/v1/sessions/${sessionID}/captions/languages/English_GBR`);
		console.log('Sending SRT file to Panopto');
		const srtForm = new FormData();
		srtForm.append('file', srtFile);
		srtForm.append('language', 'English_GBR');
		const srtRes = await authFetch.post(`api/v1/sessions/${sessionID}/captions`, srtForm, {
			headers: srtForm.getHeaders()
		});

		console.log('Success!');
		return new Response('Success!', { status: 200 });
	} catch (error) {
		console.error(error);
		console.error(error.response.data);
		return new Response('Failed to save the transcript to Panopto.', { status: 500 });
	}
};
