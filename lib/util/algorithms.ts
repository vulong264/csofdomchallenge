/**
 * Standard-algorithm step generators (IGCSE 0478 §7.4) for the visualiser
 * widgets. Each returns every comparison/step so the UI can animate them.
 */

export interface SortStep {
  array: number[];
  compared: [number, number];
  swapped: boolean;
  pass: number;
}

export function bubbleSortSteps(input: number[]): { steps: SortStep[]; sorted: number[] } {
  const arr = input.slice();
  const steps: SortStep[] = [];
  for (let pass = 0; pass < arr.length - 1; pass += 1) {
    let swappedAny = false;
    for (let i = 0; i < arr.length - 1 - pass; i += 1) {
      const swapped = arr[i] > arr[i + 1];
      if (swapped) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swappedAny = true;
      }
      steps.push({ array: arr.slice(), compared: [i, i + 1], swapped, pass });
    }
    if (!swappedAny) break; // optimised bubble sort stops early when a pass makes no swaps
  }
  return { steps, sorted: arr };
}

export interface SearchStep {
  index: number;
  value: number;
  match: boolean;
}

export function linearSearchSteps(arr: number[], target: number): { steps: SearchStep[]; foundIndex: number } {
  const steps: SearchStep[] = [];
  let foundIndex = -1;
  for (let i = 0; i < arr.length; i += 1) {
    const match = arr[i] === target;
    steps.push({ index: i, value: arr[i], match });
    if (match) {
      foundIndex = i;
      break;
    }
  }
  return { steps, foundIndex };
}
