<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { BarLoader } from 'svelte-loading-spinners';
	import type { TranscribeUpdate } from '$lib/transcribe';
	import { slide } from 'svelte/transition';

	let url = '';
	$: sessionID = (() => {
		try {
			return new URL(url).searchParams.get('id');
		} catch (e) {
			return null;
		}
	})();

	let loading = false;
	let updates: TranscribeUpdate[] = [];

	const transcribe = async (id?: string) => {
		loading = true;
		updates = [];
		const res = await fetch('/transcribe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ sessionID: id || sessionID })
		});
		const reader = res.body?.getReader();
		if (!reader) {
			updates = [
				...updates,
				{
					type: 'error',
					message: "Couldn't connect to server",
					time: 0
				}
			];
			loading = false;
			return;
		}

		const decoder = new TextDecoder('utf-8');
		while (true) {
			const { value, done } = await reader.read();
			const text = decoder.decode(value, { stream: true });
			const segments = text.split('\n');
			try {
				segments.forEach((segment) => {
					if (!segment) return; // Skip empty segments
					const json = JSON.parse(segment);
					console.log('Received', json, done);
					updates = [...updates, json];
				});
			} catch (error) {
				console.log(error);
				break;
			}
			if (done) {
				loading = false;
				break;
			}
		}
		loading = false;
	};

	onMount(async () => {
		const id = $page.url.searchParams.get('id');
		if (id) {
			if ($page.data.isSignedIn) {
				url = id;
				transcribe(id);
			} else {
				// Wait for the user to sign in
			}
		}
	});
</script>

<main>
	<h1>Panopto + OpenAI Whisper</h1>
	<p>
		This tool is available for use in trialing new AI transcription services for Panopto. It is not
		intended for production use, but is available to all staff for testing.
	</p>
	{#if !$page.data.isSignedIn}
		<p>To begin, sign in with your University of Auckland account through Panopto:</p>
		<a href={$page.data.authorizeURL} class="btn btn-primary btn-block text-center"
			>Sign in with Panopto</a
		>
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
		{#if loading || updates.length > 0}
			<div class="updates">
				{#each updates as update}
					<div
						class="update"
						class:error={update.type === 'error'}
						class:progress={update.type === 'progress'}
						class:complete={update.type === 'complete'}
					>
						<div class="time">{update.time.toFixed(2)}s</div>
						<div class="message">{update.message}</div>
					</div>
				{/each}
			</div>
		{/if}
		<p>
			Alternatively, drag this bookmarklet to your bookmarks bar and click when viewing a Panopto
			video to run the captioning process.
		</p>
		<a
			class="bookmarklet"
			href={`javascript:window.open('${$page.url.href}?id=' + (new URL(document.URL)).searchParams.get('id'))`}
			on:click|preventDefault={() => {}}
		>
			Transcribe this video
		</a>
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
		& .bookmarklet {
			@apply mt-4 text-center bg-uni-blue text-white font-bold py-1 px-2 rounded;
		}
		& .updates {
			@apply rounded-b border-2 border-dashed border-gray-300 bg-gray-200 p-4;
			@apply font-mono text-xs;
			& .update {
				@apply grid my-1;
				grid-template-columns: auto 1fr;
				&.error {
					@apply text-uni-color-red font-bold;
				}
				&.progress {
					@apply text-uni-color-blue;
				}
				&.complete {
					@apply text-uni-color-green font-bold;
				}
				& .time {
					@apply pr-2 box-content;
					width: 5ch;
				}
				& .message {
					@apply pl-2 border-l-2 border-solid border-slate-300;
					@apply break-words overflow-x-auto;
				}
			}
		}
	}
	.loadingBox {
		& :global(.wrapper) {
			width: 100% !important;
		}
	}
</style>
