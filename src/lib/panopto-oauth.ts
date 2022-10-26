import { AuthorizationCode, type ModuleOptions } from 'simple-oauth2';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import axios from 'axios';

const config: ModuleOptions<'client_id'> = {
	client: {
		id: env.PANOPTO_CLIENTID,
		secret: env.PANOPTO_CLIENTSECRET
	},
	auth: {
		tokenHost: `https://${publicEnv.PUBLIC_PANOPTO_HOST}/Panopto/oauth2/`,
		tokenPath: '/Panopto/oauth2/connect/token',
		authorizePath: '/Panopto/oauth2/connect/authorize'
	},
	options: {
		authorizationMethod: 'header',
		// Types are wrong, this is actually required for us to interface with Panopto
		// @ts-ignore
		credentialsEncodingMode: 'loose'
	}
};

export const client = new AuthorizationCode(config);
export const scope = ['api', 'openid', 'profile', 'email'];
export const authorizeURL = (redirect: string) =>
	client.authorizeURL({ redirect_uri: redirect, scope });

export const createAuthFetch = (token: string) => {
	return axios.create({
		baseURL: `https://${publicEnv.PUBLIC_PANOPTO_HOST}/Panopto`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	});
};
