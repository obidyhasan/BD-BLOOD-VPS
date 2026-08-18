export type SidebarNavigationChild = {
  title: string;
  url: string;
};

export type SidebarNavigationItem = {
  title: string;
  url?: string;
  items?: SidebarNavigationChild[];
};

export type ResolvedSidebarNavigationItem<T extends SidebarNavigationItem> =
  Omit<T, "url" | "items"> & {
    url: string;
    items?: SidebarNavigationChild[];
  };

export function resolveSidebarNavigationItem<T extends SidebarNavigationItem>(
  item: T,
): ResolvedSidebarNavigationItem<T> | null {
  if (item.items) {
    if (item.items.length === 0) return null;

    if (item.items.length === 1) {
      return {
        ...item,
        url: item.items[0].url,
        items: undefined,
      };
    }

    return {
      ...item,
      url: item.url ?? "#",
      items: item.items,
    };
  }

  if (!item.url || item.url === "#") return null;

  return {
    ...item,
    url: item.url,
  };
}

export function resolveSidebarNavigation<T extends SidebarNavigationItem>(
  items: T[],
): ResolvedSidebarNavigationItem<T>[] {
  return items
    .map(resolveSidebarNavigationItem)
    .filter((item): item is ResolvedSidebarNavigationItem<T> => item !== null);
}
