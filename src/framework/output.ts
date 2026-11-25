/**
 * Content a calculator's `computeState` shows below its fields. A `Node` is
 * inserted as is; a string is shown as plain text.
 */
export type OutputDisplayContent = Node | string;

/** One item shown in the output display until the next run begins. */
export interface OutputDisplayItem {
  readonly content: OutputDisplayContent;
  /** Called when the item is removed before the next run, if provided. */
  readonly dispose?: () => void;
}

/**
 * Context handed to `CalculatorDefinition.computeState`. It carries the abort
 * signal used to cancel a run and the hook used to show extra output.
 */
export interface ComputeStateContext {
  /** Aborted when the user cancels the run or a new run starts. */
  readonly signal: AbortSignal;
  /**
   * Shows `content` below the calculator's fields until the next run begins.
   * When the item is removed, `dispose` runs so resources such as a chart can
   * be torn down.
   */
  display(content: OutputDisplayContent, dispose?: () => void): void;
}
