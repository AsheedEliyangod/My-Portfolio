export function isPhoneDevice() {
  if (typeof window === "undefined") return false;

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const phoneSizedViewport = window.innerWidth <= 820 || window.innerHeight <= 480;

  return coarsePointer && phoneSizedViewport;
}
