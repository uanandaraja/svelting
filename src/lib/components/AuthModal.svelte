<script lang="ts">
import { authClient } from "$lib/auth-client";

interface Props {
	open: boolean;
	onClose: () => void;
}

let { open = $bindable(false), onClose }: Props = $props();

let loading = $state(false);

async function signInWithGoogle() {
	loading = true;
	// After auth, redirect to /chat where the pending prompt will be processed
	await authClient.signIn.social({
		provider: "google",
		callbackURL: "/chat",
	});
	loading = false;
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		handleClose();
	}
}

function handleBackdropClick(e: MouseEvent) {
	if (e.target === e.currentTarget) {
		handleClose();
	}
}

function handleClose() {
	onClose();
	open = false;
}
</script>

{#if open}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="auth-dialog-title"
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center"
		onkeydown={handleKeydown}
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
			onclick={handleBackdropClick}
			aria-label="Close dialog"
		></button>

		<!-- Dialog -->
		<div
			class="relative bg-background border border-border rounded-xl shadow-lg max-w-sm w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200"
		>
			<!-- Close button -->
			<button
				type="button"
				onclick={handleClose}
				class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
				aria-label="Close"
			>
				<svg
					class="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>

			<div class="text-center mb-6">
				<h2
					id="auth-dialog-title"
					class="text-2xl font-semibold text-foreground mb-2"
				>
					sign in to continue
				</h2>
				<p class="text-muted-foreground text-sm">
					sign in to start chatting
				</p>
			</div>

			<button
				onclick={signInWithGoogle}
				disabled={loading}
				class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				<span class="text-foreground font-medium">
					{loading ? "signing in..." : "continue with google"}
				</span>
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes zoom-in-95 {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}

	.animate-in {
		animation: fade-in 0.2s ease-out, zoom-in-95 0.2s ease-out;
	}
</style>
