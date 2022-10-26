import type { PageServerLoad } from './$types';
import { client, createAuthFetch, scope } from '$lib/panopto-oauth';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const authorizeURL = client.authorizeURL({ redirect_uri: `${url.origin}/callback`, scope });

	const token = cookies.get('panopto_access_token');
	const expires = cookies.get('panopto_access_token_expires');
	const accessToken = token && expires && new Date(expires) > new Date() ? token : null;
	if (accessToken) {
		const authFetch = createAuthFetch(accessToken);
		// Get profile
		let userdata;
		try {
			userdata = (await authFetch('oauth2/connect/userinfo')).data;
		} catch (error) {
			console.error(error);
		}
		return {
			authorizeURL,
			isSignedIn: !!accessToken,
			userdata
		};
	} else {
		return {
			authorizeURL,
			isSignedIn: !!accessToken
		};
	}
};
