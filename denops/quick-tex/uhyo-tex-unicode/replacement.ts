import { GlobalContext, runContext, SourceBuf } from "./context.ts";

export interface ReplaceResult {
  /**
   * Value after replacement.
   */
  value: string;
  /**
   * Cursor position after replacement.
   */
  position: number;
  /**
   * Flag whether change occurred
   */
  changed: boolean;
}

/**
 * Perform replacement on given value.
 */
export function runReplace(value: string, position: number): ReplaceResult {
  const buf: SourceBuf = {
    value,
    inputPosition: 0,
    originalCursorPosition: position,
    cursorPosition: position,
  };

  const baseContext = new GlobalContext();

  const {
    value: result,
    changed,
  } = runContext(buf, baseContext);

  return {
    value: result,
    position: buf.cursorPosition,
    changed,
  };
}
