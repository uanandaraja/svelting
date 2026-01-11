<script lang="ts">
import { browser } from "$app/environment";
import ChatSidebar from "$lib/components/ChatSidebar.svelte";

let { children, data } = $props();

const SIDEBAR_KEY = "sidebar-open";

// Read initial state synchronously from localStorage to prevent flash
function getInitialState(): boolean {
	if (browser) {
		const stored = localStorage.getItem(SIDEBAR_KEY);
		if (stored !== null) {
			return stored === "true";
		}
	}
	return true; // Default to open
}

let sidebarOpen = $state(getInitialState());
let mounted = $state(browser); // True immediately on client, false on server

function toggleSidebar() {
	sidebarOpen = !sidebarOpen;
	if (browser) {
		localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
	}
}
</script>

<div
	class="flex h-screen bg-background overflow-hidden"
	class:opacity-0={!mounted}
	class:opacity-100={mounted}
>
	{#await data.conversations}
		<!-- Loading state - show sidebar with empty conversations -->
		<ChatSidebar conversations={[]} open={sidebarOpen} onToggle={toggleSidebar} loading={true} />
	{:then conversations}
		<ChatSidebar {conversations} open={sidebarOpen} onToggle={toggleSidebar} />
	{:catch}
		<!-- Error state - show empty sidebar -->
		<ChatSidebar conversations={[]} open={sidebarOpen} onToggle={toggleSidebar} />
	{/await}

	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
		{@render children()}
	</div>
</div>
