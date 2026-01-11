<script lang="ts">
import ChatSidebar from "$lib/components/ChatSidebar.svelte";

let { children, data } = $props();

let sidebarOpen = $state(true);

function toggleSidebar() {
	sidebarOpen = !sidebarOpen;
}
</script>

<div class="flex h-screen bg-background overflow-hidden">
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
