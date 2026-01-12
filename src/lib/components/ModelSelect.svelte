<script lang="ts">
import { getModelsByProvider, getModelById, type Model } from "$lib/ai/models";
import { ChevronDown } from "$lib/icons";

let {
	value,
	onchange,
	disabled = false,
}: {
	value: string;
	onchange?: (modelId: string) => void;
	disabled?: boolean;
} = $props();

const modelsByProvider = getModelsByProvider();
const providers = Array.from(modelsByProvider.keys());

const selectedModel = $derived(getModelById(value));
const displayName = $derived(
	selectedModel?.name ?? value.split("/").pop() ?? "Select model",
);

function handleChange(e: Event) {
	const select = e.target as HTMLSelectElement;
	onchange?.(select.value);
}
</script>

<div class="relative inline-flex items-center">
	<select
		{value}
		onchange={handleChange}
		{disabled}
		class="appearance-none bg-transparent text-xs text-muted-foreground/70 hover:text-foreground pr-5 py-1 rounded-lg cursor-pointer outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:text-foreground"
	>
		{#each providers as provider}
			<optgroup label={provider}>
				{#each modelsByProvider.get(provider) ?? [] as model}
					<option value={model.id}>{model.name}</option>
				{/each}
			</optgroup>
		{/each}
	</select>
	<ChevronDown class="absolute right-0 size-3.5 text-muted-foreground/50 pointer-events-none" />
</div>
