declare global {
	namespace process {
		interface ProcessEnv {
			PUBLIC_PANOPTO_HOST: string;
			PANOPTO_CLIENTID: string;
			PANOPTO_CLIENTSECRET: string;
		}
	}
}
