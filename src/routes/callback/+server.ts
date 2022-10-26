import { client, scope } from '$lib/panopto-oauth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code) return new Response('No code provided', { status: 400 });
	const tokenParams = {
		code,
		redirect_uri: `${url.origin}${url.pathname}`
	};

	try {
		const accessToken = await client.getToken(tokenParams);
		cookies.set('panopto_access_token', accessToken.token.access_token);
		cookies.set('panopto_access_token_expires', accessToken.token.expires_at);
		return new Response('Success', { status: 200 });
	} catch (error: any) {
		console.error(error);
		return new Response('Access Token Error', { status: 500 });
	}
};
