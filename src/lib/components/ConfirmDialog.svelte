<script lang="ts">
	interface Props {
		open: boolean;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		destructive?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open = $bindable(false),
		title = "Are you sure?",
		description = "",
		confirmText = "Confirm",
		cancelText = "Cancel",
		destructive = false,
		onConfirm,
		onCancel,
	}: Props = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			handleCancel();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="dialog-title"
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
			<h2 id="dialog-title" class="text-lg font-semibold text-foreground">
				{title}
			</h2>

			{#if description}
				<p class="mt-2 text-sm text-muted-foreground">
					{description}
				</p>
			{/if}

			<div class="mt-6 flex gap-3 justify-end">
				<button
					type="button"
					onclick={handleCancel}
					class="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {destructive
						? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
						: 'bg-primary text-primary-foreground hover:bg-primary/90'}"
				>
					{confirmText}
				</button>
			</div>
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
