import { client, scope, createAuthFetch } from '$lib/panopto-oauth';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import fs from 'fs';
import Transcriber, { type TranscribeUpdate } from '$lib/transcribe';

export const POST: RequestHandler = async ({ cookies, request }) => {
	const { sessionID } = await request.json().catch(() => ({ sessionID: '' }));
	if (!sessionID)
		return new Response(
			JSON.stringify({
				type: 'error',
				message: 'No session ID provided'
			} as TranscribeUpdate),
			{ status: 400 }
		);

	const token = cookies.get('panopto_access_token');
	const expires = cookies.get('panopto_access_token_expires');
	const accessToken = token && expires && new Date(expires) > new Date() ? token : null;
	if (!accessToken)
		return new Response(
			JSON.stringify({
				type: 'error',
				message: 'No access token provided'
			} as TranscribeUpdate),
			{ status: 400 }
		);

	const transcribe = new Transcriber(sessionID, accessToken);

	const readable = new ReadableStream<string>({
		async start(controller) {
			try {
				console.log('User starting a transcription!');
				const updates = transcribe.transcribe();
				for await (const update of updates) {
					if (transcribe.cancelled) {
						controller.close();
						return;
					}
					controller.enqueue(JSON.stringify(update) + '\n\n');
				}
				controller.close();
				return;
			} catch (error) {
				console.error(error);
				controller.enqueue(JSON.stringify({ type: 'error', message: error }));
				controller.close();
				return;
			}
		},
		cancel() {
			console.log('User Cancelled!');
			transcribe.cancel();
		}
	});

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/plain',
			Connection: 'keep-alive',
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'no-cache'
		}
	});
};
