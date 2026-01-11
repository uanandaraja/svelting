<script lang="ts">
import type { UIMessage } from "@ai-sdk/svelte";
import { Streamdown } from "svelte-streamdown";
import Code from "svelte-streamdown/code";
import { extractTextFromParts } from "$lib/ai";
import {
	shikiThemes,
	streamdownTheme,
	type ShikiThemeName,
} from "$lib/streamdown/config";

let {
	message,
	shikiTheme,
}: {
	message: UIMessage;
	shikiTheme: ShikiThemeName;
} = $props();

const content = $derived(extractTextFromParts(message.parts));
const isUser = $derived(message.role === "user");
</script>

<div class="flex {isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
	{#if isUser}
		<!-- User messages: styled bubble -->
		<div class="max-w-[80%] rounded-2xl px-4 py-3 bg-muted/80 text-foreground text-sm backdrop-blur-sm">
			<p class="whitespace-pre-wrap leading-relaxed">{content}</p>
		</div>
	{:else}
		<!-- Assistant messages: rendered with Streamdown -->
		<div class="w-full text-foreground">
			<Streamdown
				{content}
				theme={streamdownTheme}
				{shikiThemes}
				{shikiTheme}
				components={{ code: Code }}
			/>
		</div>
	{/if}
</div>
