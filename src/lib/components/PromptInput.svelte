<script lang="ts">
import { ArrowUp } from "$lib/icons";
import ModelSelect from "./ModelSelect.svelte";

let {
	placeholder = "Type your questions here...",
	onsubmit,
	disabled = false,
	isStreaming = false,
	value = $bindable(""),
	model = "",
	onModelChange,
}: {
	placeholder?: string;
	onsubmit?: (value: string) => void | Promise<void>;
	disabled?: boolean;
	/** External streaming state - shows spinner when true */
	isStreaming?: boolean;
	/** Bindable input value for controlled mode */
	value?: string;
	/** Current model ID */
	model?: string;
	/** Callback when model is changed */
	onModelChange?: (modelId: string) => void;
} = $props();

let textareaRef: HTMLTextAreaElement;
let isSubmitting = $state(false);

// Combined loading state: either internal submission or external streaming
const isLoading = $derived(isSubmitting || isStreaming);
const isDisabled = $derived(disabled || isLoading);

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
	if (!value.trim() || isDisabled) return;

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
  class="relative w-full max-w-2xl rounded-2xl bg-muted/50 outline outline-1 outline-border/50 antialiased cursor-text backdrop-blur-sm hover:outline-border focus-within:outline-border focus-within:outline-2 transition-all duration-200"
  class:opacity-50={isDisabled}
>
  <textarea
    bind:this={textareaRef}
    bind:value
    oninput={autoResize}
    onkeydown={handleKeydown}
    {placeholder}
    rows={1}
    disabled={isDisabled}
    class="w-full px-5 pt-5 pb-14 text-sm text-foreground bg-transparent resize-none outline-none placeholder:text-muted-foreground/70 overflow-y-auto disabled:cursor-not-allowed leading-relaxed"
    style="min-height: 104px; max-height: 192px;"
  ></textarea>
  <!-- Bottom toolbar -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="absolute bottom-3 left-5 right-14 flex items-center"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    {#if model}
      <ModelSelect value={model} onchange={onModelChange} disabled={isDisabled} />
    {/if}
  </div>
  <button
    type="button"
    aria-label="Send message"
    onclick={handleSubmit}
    disabled={!value.trim() || isDisabled}
    class="absolute bottom-2 right-2 flex justify-center items-center p-2 rounded-xl bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
  >
    {#if isLoading}
      <div
        class="size-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"
      ></div>
    {:else}
      <ArrowUp class="size-5 text-primary-foreground" />
    {/if}
  </button>
</div>
