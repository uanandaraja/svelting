<script lang="ts">
import ChatSidebar from "$lib/components/ChatSidebar.svelte";

let { children, data } = $props();

let sidebarOpen = $state(true);

// Ensure conversations are reactive
const conversations = $derived(data.conversations);

function toggleSidebar() {
	sidebarOpen = !sidebarOpen;
}
</script>

<div class="flex h-screen bg-background overflow-hidden">
	<ChatSidebar {conversations} open={sidebarOpen} onToggle={toggleSidebar} />

	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
		{@render children()}
	</div>
</div>
