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

<div class="flex {isUser ? 'justify-end' : 'justify-start'}">
	{#if isUser}
		<!-- User messages: styled bubble -->
		<div class="max-w-[80%] rounded-2xl px-4 py-3 bg-muted text-foreground text-sm">
			<p class="whitespace-pre-wrap">{content}</p>
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
