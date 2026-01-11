<script lang="ts">
import "./layout.css";
import favicon from "$lib/assets/favicon.svg";

const { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="real time, durable, chat app in svelte" />
</svelte:head>
{@render children()}
