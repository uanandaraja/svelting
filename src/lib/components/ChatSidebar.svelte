<script lang="ts">
import { page } from "$app/state";
import { invalidate } from "$app/navigation";
import { Trash } from "$lib/icons";
import ConfirmDialog from "./ConfirmDialog.svelte";
import ThemeSwitcher from "./ThemeSwitcher.svelte";
import type { Conversation } from "$lib/ai";
import { deleteConversation } from "../../routes/chat/data.remote";

interface Props {
	conversations: Conversation[];
	open: boolean;
	onToggle: () => void;
}

let { conversations, open, onToggle }: Props = $props();

// Get current conversation ID from URL
const currentId = $derived(page.params.id);

// Delete state
let deleteDialogOpen = $state(false);
let conversationToDelete = $state<{ id: string; title: string } | null>(null);
let isDeleting = $state(false);

function truncate(text: string | undefined, maxLength: number): string {
	if (!text) return "New conversation";
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trim() + "...";
}

function formatDate(dateStr: string) {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

function handleDeleteClick(
	e: MouseEvent,
	id: string,
	firstMessage: string | undefined,
) {
	e.preventDefault();
	e.stopPropagation();
	conversationToDelete = { id, title: truncate(firstMessage, 30) };
	deleteDialogOpen = true;
}

async function handleConfirmDelete() {
	if (!conversationToDelete) return;

	const idToDelete = conversationToDelete.id;
	isDeleting = true;

	try {
		await deleteConversation(idToDelete);
		await invalidate("app:conversations");
	} finally {
		isDeleting = false;
		conversationToDelete = null;
	}
}

function handleCancelDelete() {
	conversationToDelete = null;
}
</script>

<!-- Sidebar -->
<aside
	class="h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
	class:w-64={open}
	class:w-0={!open}
>
	<div class="flex flex-col h-full w-64">
		<!-- Header -->
		<header class="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0">
			<a href="/" class="text-lg font-semibold text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors">
				svelting
			</a>
			<button
				type="button"
				onclick={onToggle}
				class="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
				aria-label="Close sidebar"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24">
					<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5">
						<path d="M2 12c0-3.75 0-5.625.955-6.939A5 5 0 0 1 4.06 3.955C5.375 3 7.251 3 11 3h2c3.75 0 5.625 0 6.939.955a5 5 0 0 1 1.106 1.106C22 6.375 22 8.251 22 12s0 5.625-.955 6.939a5 5 0 0 1-1.106 1.106C18.625 21 16.749 21 13 21h-2c-3.75 0-5.625 0-6.939-.955a5 5 0 0 1-1.106-1.106C2 17.625 2 15.749 2 12Zm7.5-8.5v17"/>
						<path stroke-linecap="round" d="M5 7h1.5M5 11h1.5M17 10l-1.226 1.057c-.516.445-.774.667-.774.943s.258.498.774.943L17 14"/>
					</g>
				</svg>
			</button>
		</header>

		<!-- New Chat Button -->
		<div class="px-3 py-3 shrink-0">
			<a
				href="/chat"
				class="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-colors"
			>
				<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				new chat
			</a>
		</div>

		<!-- Conversations List -->
		<nav class="flex-1 overflow-y-auto px-3 pb-3">
			{#if conversations.length === 0}
				<p class="text-sm text-sidebar-foreground/50 text-center py-4">no conversations yet</p>
			{:else}
				<ul class="space-y-1">
					{#each conversations as conversation (conversation.id)}
						{@const isActive = currentId === conversation.id}
						<li>
							<a
								href="/chat/{conversation.id}"
								data-sveltekit-preload-data="hover"
								class="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors {isActive
									? 'bg-sidebar-accent text-sidebar-accent-foreground'
									: 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
							>
								<div class="flex-1 min-w-0">
									<p class="truncate">{truncate(conversation.firstMessage, 28)}</p>
									<p class="text-xs text-sidebar-foreground/50 mt-0.5">
										{formatDate(conversation.updatedAt)}
									</p>
								</div>
								<button
									type="button"
									onclick={(e) => handleDeleteClick(e, conversation.id, conversation.firstMessage)}
									class="p-1 rounded opacity-0 group-hover:opacity-100 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
									aria-label="Delete conversation"
								>
									<Trash class="size-3.5" />
								</button>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</nav>

		<!-- Footer with Theme Switcher -->
		<footer class="px-3 py-3 border-t border-sidebar-border shrink-0">
			<div class="flex items-center justify-between">
				<span class="text-xs text-sidebar-foreground/50">Theme</span>
				<ThemeSwitcher />
			</div>
		</footer>
	</div>
</aside>

<!-- Toggle button - always rendered, visibility controlled by CSS -->
<button
	type="button"
	onclick={onToggle}
	class="fixed top-4 left-4 z-50 p-2 rounded-lg bg-muted hover:bg-accent text-foreground transition-all duration-300"
	class:opacity-0={open}
	class:pointer-events-none={open}
	class:opacity-100={!open}
	aria-label="Open sidebar"
>
	<svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24">
		<g fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M2 12c0-3.69 0-5.534.814-6.841a4.8 4.8 0 0 1 1.105-1.243C5.08 3 6.72 3 10 3h4c3.28 0 4.919 0 6.081.916c.43.338.804.759 1.105 1.243C22 6.466 22 8.31 22 12s0 5.534-.814 6.841a4.8 4.8 0 0 1-1.105 1.243C18.92 21 17.28 21 14 21h-4c-3.28 0-4.919 0-6.081-.916a4.8 4.8 0 0 1-1.105-1.243C2 17.534 2 15.69 2 12Z"/>
			<path stroke-linejoin="round" d="M9.5 3v18"/>
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 7h1m-1 3h1"/>
		</g>
	</svg>
</button>

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
