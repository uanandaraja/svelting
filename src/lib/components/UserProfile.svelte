<script lang="ts">
import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { authClient } from "$lib/auth-client";
import { ChevronDown } from "$lib/icons";

interface Props {
	user: {
		name: string;
		email: string;
		image?: string | null;
	};
}

let { user }: Props = $props();

let popoverOpen = $state(false);
let containerRef = $state<HTMLDivElement | null>(null);

function togglePopover() {
	popoverOpen = !popoverOpen;
}

function closePopover() {
	popoverOpen = false;
}

async function handleSignOut() {
	await authClient.signOut();
	goto("/auth");
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		closePopover();
	}
}

function handleClickOutside(e: MouseEvent) {
	if (containerRef && !containerRef.contains(e.target as Node)) {
		closePopover();
	}
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

$effect(() => {
	if (!browser) return;

	if (popoverOpen) {
		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleKeydown);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleKeydown);
		};
	}
});
</script>

<div class="relative" bind:this={containerRef}>
	<!-- Profile Button -->
	<button
		type="button"
		onclick={togglePopover}
		class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
		aria-expanded={popoverOpen}
		aria-haspopup="true"
	>
		<!-- Avatar -->
		{#if user.image}
			<img
				src={user.image}
				alt={user.name}
				class="size-8 rounded-full object-cover shrink-0"
			/>
		{:else}
			<div class="size-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
				{getInitials(user.name)}
			</div>
		{/if}

		<!-- Name -->
		<span class="flex-1 text-left truncate">{user.name}</span>

		<!-- Chevron -->
		<ChevronDown class="size-4 text-sidebar-foreground/50 shrink-0 transition-transform {popoverOpen ? 'rotate-180' : ''}" />
	</button>

	<!-- Popover -->
	{#if popoverOpen}
		<div
			role="menu"
			class="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in"
		>
			<!-- User Info -->
			<div class="px-3 py-3 border-b border-border">
				<p class="text-sm font-medium text-popover-foreground truncate">{user.name}</p>
				<p class="text-xs text-muted-foreground truncate">{user.email}</p>
			</div>

			<!-- Sign Out Button -->
			<button
				type="button"
				onclick={handleSignOut}
				role="menuitem"
				class="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
			>
				<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
				</svg>
				Sign out
			</button>
		</div>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: fade-in 0.15s ease-out;
	}
</style>
