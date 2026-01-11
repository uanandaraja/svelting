import { onMount } from "svelte";

/**
 * Svelte 5 rune-based hook for detecting dark mode.
 * Observes changes to the `dark` class on document.documentElement.
 */
export function useDarkMode() {
	let isDark = $state(false);

	onMount(() => {
		const checkTheme = () => {
			isDark =
				document.documentElement.classList.contains("dark") ||
				document.body.classList.contains("dark");
		};

		checkTheme();

		const observer = new MutationObserver(checkTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	});

	return {
		get isDark() {
			return isDark;
		},
	};
}
