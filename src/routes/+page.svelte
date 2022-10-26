<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { BarLoader } from 'svelte-loading-spinners';

	onMount(() => {
		if (!$page.data.isSignedIn) goto($page.data.authorizeURL);
	});

	let url = '';
	$: sessionID = (() => {
		try {
			return new URL(url).searchParams.get('id');
		} catch (e) {
			return null;
		}
	})();

	let loading = false;

	const transcribe = async () => {
		loading = true;
		await fetch('/transcribe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ sessionID })
		});
		loading = false;
	};
</script>

<main>
	<h1>Panopto + OpenAI Whisper</h1>
	<p>
		This tool is available for use in trialing new AI transcription services for Panopto. It is not
		intended for production use, but is available to all staff for testing.
	</p>
	{#if !$page.data.isSignedIn}
		<p>To begin, sign in with your University of Auckland account through Panopto:</p>
		<a href={$page.data.authorizeURL} class="btn btn-primary">Sign in with Panopto</a>
	{:else}
		<p>
			You are signed in as <span class="username"
				>{$page.data?.userdata?.given_name || 'an anonymous user'}</span
			>. You can now use the tool to transcribe your Panopto recordings. To begin, paste the URL of
			the session you want transcribed below.
		</p>
		<h2>Please note:</h2>
		<ul class="list-disc list-inside">
			<li>You must be the owner of the session to transcribe it</li>
			<li>This will delete any existing English (UK) captions</li>
			<li>Transcription takes a long time - up to 60 minutes! Be prepared to wait.</li>
		</ul>
		<input type="text" class="form-control" placeholder="Enter Panopto URL" bind:value={url} />
		<button
			class="btn btn-primary btn-block"
			disabled={!sessionID || loading}
			title={!sessionID ? 'Please enter a valid Panopto URL' : 'Click to begin transcribing'}
			on:click={() => transcribe()}
		>
			{#if loading}
				Transcribing...
			{:else}
				Transcribe
			{/if}
		</button>
		{#if loading}
			<div class="m-auto loadingBox">
				<BarLoader color="#00467F" />
			</div>
		{/if}
	{/if}
</main>

<style lang="postcss">
	main {
		& h1 {
			@apply text-4xl font-light text-center;
		}
		& h2 {
			@apply font-bold mt-4;
		}
		& p {
			@apply mt-4;
		}
		& input {
			@apply block w-full mt-4;
		}
	}
	.loadingBox {
		& :global(.wrapper) {
			width: 100% !important;
		}
	}
</style>
