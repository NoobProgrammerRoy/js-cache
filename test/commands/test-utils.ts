import MapStore from '../../src/map-store.js';
import { getResponseFromOperation } from '../../src/operator.js';

let store: MapStore;

export function setupStore() {
  store = new MapStore();
}

export function getStore() {
  return store;
}

export function executeCommand(operation: string, args: string[]) {
  return getResponseFromOperation(store, operation, args);
}
