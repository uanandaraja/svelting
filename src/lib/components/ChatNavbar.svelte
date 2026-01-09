<script lang="ts">
	interface Props {
		rightContent?: import("svelte").Snippet;
	}

	let { rightContent }: Props = $props();
</script>

<header class="border-b border-border px-6 py-4 flex-shrink-0">
	<div class="max-w-3xl mx-auto flex items-center justify-between">
		<a href="/" class="text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors">
			svelting
		</a>
		<div class="flex items-center gap-4">
			{#if rightContent}
				{@render rightContent()}
			{/if}
			<a
				href="/"
				class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
			>
				new chat
			</a>
		</div>
	</div>
</header>
