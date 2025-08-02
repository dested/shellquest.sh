export const ANSI = {
  switchToAlternateScreen: "\x1b[?1049h",
  switchToMainScreen: "\x1b[?1049l",
  reset: "\x1b[0m",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",

  resetCursorColor: "\x1b]12;default\x07",
  saveCursorState: "\x1b[s",
  restoreCursorState: "\x1b[u",

  // Mouse handling
  enableMouseTracking: "\x1b[?1000h",
  disableMouseTracking: "\x1b[?1000l",
  enableButtonEventTracking: "\x1b[?1002h", 
  disableButtonEventTracking: "\x1b[?1002l",
  enableAnyEventTracking: "\x1b[?1003h",
  disableAnyEventTracking: "\x1b[?1003l",
  enableSGRMouseMode: "\x1b[?1006h",
  disableSGRMouseMode: "\x1b[?1006l",
}
