<svelte:head>
	<title>chat | svelting</title>
</svelte:head>

<script lang="ts">
	import { invalidate } from "$app/navigation";
	import ChatNavbar from "$lib/components/ChatNavbar.svelte";
	import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
	import { Trash } from "$lib/icons";
	import { deleteConversation } from "./data.remote";

	// Receive data from +page.server.ts load function
	let { data } = $props();

	// Local state for optimistic updates
	let conversations = $derived(data.conversations);
	let localConversations = $state<typeof data.conversations | null>(null);
	let displayConversations = $derived(localConversations ?? conversations);

	let deleteDialogOpen = $state(false);
	let conversationToDelete = $state<{ id: string; title: string } | null>(null);
	let isDeleting = $state(false);

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	function truncate(text: string | undefined, maxLength: number): string {
		if (!text) return "New conversation";
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength).trim() + "...";
	}

	function handleDeleteClick(e: MouseEvent, id: string, firstMessage: string | undefined) {
		e.preventDefault();
		e.stopPropagation();
		conversationToDelete = { id, title: truncate(firstMessage, 40) };
		deleteDialogOpen = true;
	}

	async function handleConfirmDelete() {
		if (!conversationToDelete) return;

		const idToDelete = conversationToDelete.id;
		isDeleting = true;

		try {
			// Optimistic update
			localConversations = displayConversations.filter((c) => c.id !== idToDelete);
			await deleteConversation(idToDelete);
			// Invalidate to sync with server
			await invalidate("app:conversations");
		} finally {
			isDeleting = false;
			conversationToDelete = null;
			localConversations = null;
		}
	}

	function handleCancelDelete() {
		conversationToDelete = null;
	}
</script>

<div class="min-h-screen bg-background">
	<ChatNavbar />

	<!-- Content -->
	<main class="max-w-3xl mx-auto px-6 py-8">
		<h1 class="text-2xl font-semibold text-foreground mb-6">your conversations</h1>

		{#if displayConversations.length === 0}
			<div class="text-center py-12">
				<p class="text-muted-foreground mb-4">no conversations yet</p>
				<a
					href="/"
					class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
				>
					start your first chat
				</a>
			</div>
		{:else}
			<div class="space-y-2">
				{#each displayConversations as conversation (conversation.id)}
					<a
						href="/chat/{conversation.id}"
						data-sveltekit-preload-data="hover"
						class="block p-4 rounded-xl bg-muted hover:bg-accent transition-colors group"
					>
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-foreground truncate">
									{truncate(conversation.firstMessage, 50)}
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									{formatDate(conversation.updatedAt)}
								</p>
							</div>
							<div class="flex items-center gap-2 ml-4">
								<button
									type="button"
									onclick={(e) => handleDeleteClick(e, conversation.id, conversation.firstMessage)}
									class="p-2 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
									aria-label="Delete conversation"
								>
									<Trash class="size-4" />
								</button>
								<svg
									class="size-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Delete conversation?"
	description={`This will permanently delete "${conversationToDelete?.title ?? ''}". This action cannot be undone.`}
	confirmText={isDeleting ? "Deleting..." : "Delete"}
	cancelText="Cancel"
	destructive
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>
