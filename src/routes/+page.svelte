<script lang="ts">
  import { goto } from "$app/navigation";
  import PromptInput from "$lib/components/PromptInput.svelte";

  let error = $state("");
  let isLoading = $state(false);

  async function handleSubmit(message: string) {
    if (!message.trim()) return;

    isLoading = true;
    error = "";

    try {
      // Store the message in sessionStorage for the chat page to pick up
      sessionStorage.setItem("pendingMessage", message.trim());

      // Create conversation WITHOUT the first message
      const res = await fetch("/chat/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.status === 401) {
        // Not authenticated, redirect to auth
        // Keep the message in storage for after auth
        goto("/auth");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to create conversation");
      }

      const { id } = await res.json();
      goto(`/chat/${id}`);
    } catch (e) {
      // Clear storage on error
      sessionStorage.removeItem("pendingMessage");
      error = e instanceof Error ? e.message : "Something went wrong";
      isLoading = false;
    }
  }
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
    <PromptInput onsubmit={handleSubmit} disabled={isLoading} />
    {#if error}
      <p class="mt-4 text-sm text-destructive">{error}</p>
    {/if}
  </div>
</div>
