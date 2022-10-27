<script lang="ts">
	import '../app.postcss';
</script>

<div class="wrapper">
	<slot />
</div>

<footer>
	<p>
		Copyright © University of Auckland 2022. <br />
		Developed by
		<a
			href="https://www.auckland.ac.nz/en/staff/learning-and-teaching/teaching-course-development1/ranga-auaha-ako.html"
		>
			Ranga Auaha Ako</a
		>
		|
		<a href="https://github.com/Ranga-Auaha-Ako/panopto-whisperer/">Source &amp; Contribute</a>
	</p>
</footer>

<style lang="postcss">
	:global(body) {
		/* @apply bg-uni-blue-light; */
		background-image: url(/assets/page-bg.svg);
		background-attachment: fixed;
		background-size: cover;
		background-position: top center;
	}
	.wrapper {
		@apply max-w-xl mx-auto px-4 py-8 mt-8;
		@apply bg-white rounded-lg shadow-xl;
		/* @apply border-2 border-uni-color-s; */
	}
	footer {
		@apply mt-14 text-center text-sm text-gray-500;
		& a {
			@apply underline hover:text-gray-700;
		}
	}
</style>
