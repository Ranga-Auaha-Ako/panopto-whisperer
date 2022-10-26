<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';

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

	function transcribe() {
		fetch('/transcribe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ sessionID })
		});
		throw new Error('Function not implemented.');
	}
</script>

<main>
	<h1>Panopto Whisperer</h1>
	{#if !$page.data.isSignedIn}
		<p>
			This tool is available for use in trialing new AI transcription services for Panopto. It is
			not intended for production use, but is available to all staff for testing. To begin, sign in
			with your University of Auckland account through Panopto:
		</p>
		<a href={$page.data.authorizeURL} class="btn btn-primary">Sign in with Panopto</a>
	{:else}
		<p>
			You are signed in as <span class="username"
				>{$page.data?.userdata?.given_name || 'an anonymous user'}</span
			>. You can now use the tool to transcribe your Panopto recordings.
		</p>
		<input type="text" class="form-control" placeholder="Enter Panopto URL" bind:value={url} />
		<button
			class="btn btn-primary"
			disabled={!sessionID}
			title={!sessionID ? 'Please enter a valid Panopto URL' : 'Click to begin transcribing'}
			on:click={() => transcribe()}
		>
			Transcribe</button
		>
	{/if}
</main>

<style lang="postcss">
	main {
		& h1 {
			@apply text-5xl font-light text-center mb-4;
		}
		& input {
			@apply block w-full mt-4;
		}
	}
</style>
