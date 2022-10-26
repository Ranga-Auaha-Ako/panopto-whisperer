<script lang="ts">
	import '../app.postcss';
</script>

<div class="wrapper">
	<slot />
</div>

<style lang="postcss">
	:global(body) {
		/* @apply bg-uni-blue-light; */
	}
	.wrapper {
		@apply max-w-xl mx-auto px-4 py-8 mt-8;
		@apply bg-white rounded-xl;
		@apply border border-uni-blue;
	}
</style>
