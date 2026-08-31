"use client";

/**
 * Generic add/update/remove operations for an array field that lives inside
 * some larger piece of state (e.g. `profileData.currentCv.experience`).
 *
 * Takes the current list plus a setter that knows how to write a new list
 * back into its parent state — it doesn't own state itself, so it composes
 * with whatever `useState`/`setState` already holds the list.
 */
export function useEditableList<T>(
  list: T[],
  setList: (updater: (prev: T[]) => T[]) => void
) {
  function add(item: T) {
    setList((prev) => [...prev, item]);
  }

  function update<K extends keyof T>(idx: number, key: K, value: T[K]) {
    setList((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  }

  function remove(idx: number) {
    setList((prev) => prev.filter((_, i) => i !== idx));
  }

  return { list, add, update, remove };
}
