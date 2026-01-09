<script lang="ts">
  import PromptInput from "$lib/components/PromptInput.svelte";
  let error = $state("");
</script>

<svelte:head>
  <title>svelting</title>
</svelte:head>

<div
  class="min-h-screen bg-background flex flex-col items-center justify-center p-8"
>
  <div class="w-full max-w-2xl text-center">
    <h1 class="text-5xl font-semibold text-foreground mb-6">svelting</h1>
    <p class="text-lg text-muted-foreground mb-8">
      real time, durable, chat app in svelte
    </p>
    <PromptInput />
    {#if error}
      <p class="mt-4 text-sm text-destructive">{error}</p>
    {/if}
  </div>
</div>
