<script lang="ts">
	import '../app.postcss';
</script>

<div class="wrapper">
	<slot />
</div>

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
</style>
