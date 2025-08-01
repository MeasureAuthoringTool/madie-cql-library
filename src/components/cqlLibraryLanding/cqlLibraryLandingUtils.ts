export function getTabStorageKey(tab: number): string {
  if (tab === 0) {
    return "ownedCqlLibrariesPageOptions";
  }
  if (tab === 1) {
    return "sharedCqlLibrariesPageOptions";
  }
  return "allCqlLibrariesPageOptions";
}
