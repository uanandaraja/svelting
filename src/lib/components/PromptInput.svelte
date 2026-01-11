<script lang="ts">
import { ArrowUp } from "$lib/icons";

let {
	placeholder = "Type your questions here...",
	onsubmit,
	disabled = false,
}: {
	placeholder?: string;
	onsubmit?: (value: string) => void | Promise<void>;
	disabled?: boolean;
} = $props();

let value = $state("");
let textareaRef: HTMLTextAreaElement;
let isSubmitting = $state(false);

function focusTextarea() {
	textareaRef?.focus();
}

function autoResize() {
	if (textareaRef) {
		textareaRef.style.height = "auto";
		textareaRef.style.height = Math.min(textareaRef.scrollHeight, 192) + "px";
	}
}

async function handleSubmit() {
	if (!value.trim() || isSubmitting || disabled) return;

	const submitValue = value.trim();
	isSubmitting = true;

	try {
		await onsubmit?.(submitValue);
		value = "";
		if (textareaRef) {
			textareaRef.style.height = "auto";
		}
	} finally {
		isSubmitting = false;
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		handleSubmit();
	}
}
</script>

<div
  role="button"
  tabindex="-1"
  onclick={focusTextarea}
  onkeydown={(e) => e.key === "Enter" && focusTextarea()}
  class="relative w-full max-w-2xl rounded-xl bg-muted outline outline-1 outline-border antialiased cursor-text"
  class:opacity-50={disabled}
>
  <textarea
    bind:this={textareaRef}
    bind:value
    oninput={autoResize}
    onkeydown={handleKeydown}
    {placeholder}
    rows={1}
    disabled={disabled || isSubmitting}
    class="w-full px-4.5 pt-4.5 pb-14 text-sm text-foreground bg-transparent resize-none outline-none placeholder:text-muted-foreground overflow-y-auto disabled:cursor-not-allowed"
    style="min-height: 104px; max-height: 192px;"
  ></textarea>
  <button
    type="button"
    aria-label="Send message"
    onclick={handleSubmit}
    disabled={!value.trim() || isSubmitting || disabled}
    class="absolute bottom-1.5 right-1.5 flex justify-center items-center p-1.5 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {#if isSubmitting}
      <div
        class="size-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"
      ></div>
    {:else}
      <ArrowUp class="size-5 text-primary-foreground" />
    {/if}
  </button>
</div>
