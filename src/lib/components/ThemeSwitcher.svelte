<script lang="ts">
import { onMount } from "svelte";
import { Sun, Moon } from "$lib/icons";

let isDark = $state(false);

onMount(() => {
	// Check initial theme
	isDark = document.documentElement.classList.contains("dark");

	// Watch for theme changes
	const observer = new MutationObserver(() => {
		isDark = document.documentElement.classList.contains("dark");
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	return () => observer.disconnect();
});

function toggleTheme() {
	isDark = !isDark;
	if (isDark) {
		document.documentElement.classList.add("dark");
		localStorage.setItem("theme", "dark");
	} else {
		document.documentElement.classList.remove("dark");
		localStorage.setItem("theme", "light");
	}
}
</script>

<button
	type="button"
	onclick={toggleTheme}
	class="flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
	aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
>
	{#if isDark}
		<Sun class="size-5" />
	{:else}
		<Moon class="size-5" />
	{/if}
</button>
